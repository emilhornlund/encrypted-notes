import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { getUserFromToken, isTokenExpired } from '@encrypted-notes/common';
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

      // Derive and store user keys
      await deriveAndStoreUserKeys(password);
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
      await deriveAndStoreUserKeys(password);
    } finally {
      setIsLoading(false);
    }
  };

  const deriveAndStoreUserKeys = async (password: string) => {
    try {
      // Generate salt for key derivation
      const salt = await cryptoService.generateSalt();

      // Derive user keys from password
      const keys = await cryptoService.deriveUserKeys(password, salt);
      setUserKeys(keys);

      // Wrap UMK for secure storage
      const wrappedKey = await cryptoService.wrapUMK(keys.umk, password, salt);

      // Store wrapped key securely
      localStorage.setItem(
        'wrapped_umk',
        JSON.stringify({
          wrappedKey: Array.from(wrappedKey.wrappedKey),
          salt: Array.from(wrappedKey.salt),
          params: wrappedKey.params,
        })
      );
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
