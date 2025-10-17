/* eslint-disable no-console */
import {
  getUserFromToken,
  isTokenExpired,
  WrappedKey,
} from '@encrypted-notes/common';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { cryptoService, UserKeys } from '../services/crypto.service';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  userKeys: UserKeys | null;
  login: (_email: string, _password: string) => Promise<void>;
  register: (_email: string, _password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userKeys, setUserKeys] = useState<UserKeys | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and keys on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedWrappedKey = localStorage.getItem('wrapped_umk');

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      const userInfo = getUserFromToken(storedToken);
      if (userInfo) {
        setUser(userInfo);
      }

      // Try to restore user keys if wrapped key exists
      if (storedWrappedKey) {
        // We'll need the password to unwrap, so keys will be restored on next login
      }
    } else if (storedToken && isTokenExpired(storedToken)) {
      // Token expired, remove it and keys
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wrapped_umk');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setToken(data.accessToken);
      localStorage.setItem('auth_token', data.accessToken);
      const userInfo = getUserFromToken(data.accessToken);
      if (userInfo) {
        setUser(userInfo);
      }

      // Derive and store user keys (don't fail login if this fails)
      try {
        await deriveAndStoreUserKeys(password, true);
      } catch (cryptoError) {
        console.warn(
          'Crypto key derivation failed, but login succeeded:',
          cryptoError
        );
        // Don't fail the login if crypto fails - user can still use basic features
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      setToken(data.accessToken);
      localStorage.setItem('auth_token', data.accessToken);
      const userInfo = getUserFromToken(data.accessToken);
      if (userInfo) {
        setUser(userInfo);
      }

      // Derive and store user keys for new user
      try {
        await deriveAndStoreUserKeys(password, false);
      } catch (cryptoError) {
        console.warn(
          'Crypto key derivation failed during registration:',
          cryptoError
        );
        // Don't fail registration if crypto fails - user can still register
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deriveAndStoreUserKeys = async (password: string, isLogin = false) => {
    try {
      let keys: UserKeys;

      if (isLogin) {
        // For login, try to unwrap stored UMK
        const storedWrappedKey = localStorage.getItem('wrapped_umk');
        if (storedWrappedKey) {
          try {
            const wrappedKeyData = JSON.parse(storedWrappedKey);
            const wrappedKey: WrappedKey = {
              wrappedKey: new Uint8Array(wrappedKeyData.wrappedKey),
              salt: new Uint8Array(wrappedKeyData.salt),
              params: wrappedKeyData.params,
            };

            // Unwrap and derive keys from stored UMK
            keys = await cryptoService.unwrapAndDeriveUserKeys(
              wrappedKey,
              password
            );
          } catch (unwrapError) {
            console.warn(
              'Failed to unwrap stored keys, generating new ones:',
              unwrapError
            );
            // If unwrapping fails, generate new keys
            const salt = await cryptoService.generateSalt();
            keys = await cryptoService.deriveUserKeys(password, salt);
          }
        } else {
          console.warn(
            'No stored wrapped key found for login, generating new keys'
          );
          // No stored key, generate new one
          const salt = await cryptoService.generateSalt();
          keys = await cryptoService.deriveUserKeys(password, salt);
        }
      } else {
        // For registration, generate new keys
        const salt = await cryptoService.generateSalt();
        keys = await cryptoService.deriveUserKeys(password, salt);

        // Wrap UMK for secure storage
        const wrappedKey = await cryptoService.wrapUMK(
          keys.umk,
          password,
          salt
        );

        // Store wrapped key securely
        localStorage.setItem(
          'wrapped_umk',
          JSON.stringify({
            wrappedKey: Array.from(wrappedKey.wrappedKey),
            salt: Array.from(wrappedKey.salt),
            params: wrappedKey.params,
          })
        );
      }

      setUserKeys(keys);
    } catch (error) {
      console.error('Failed to derive and store user keys:', error);
      throw new Error('Key derivation failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserKeys(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wrapped_umk');
  };

  const value: AuthContextType = {
    user,
    token,
    userKeys,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
