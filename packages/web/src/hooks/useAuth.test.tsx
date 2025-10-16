import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

// Mock the common functions
vi.mock('@encrypted-notes/common', () => ({
  getUserFromToken: vi.fn(),
  isTokenExpired: vi.fn(),
}));

// Mock the crypto service
vi.mock('../services/crypto.service', () => ({
  cryptoService: {
    generateSalt: vi.fn(),
    deriveUserKeys: vi.fn(),
    unwrapAndDeriveUserKeys: vi.fn(),
    wrapUMK: vi.fn(),
  },
}));

const TestComponent = () => {
  const { user, token, login, register, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>

      <button onClick={() => login('test@example.com', 'password').catch(() => {})}>
        Login
      </button>

      <button onClick={() => register('test@example.com', 'password').catch(() => {})}>
        Register
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('useAuth', () => {
  const mockFetch = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    global.localStorage = mockLocalStorage as any;

    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    it('should load valid token from localStorage', async () => {
      const { getUserFromToken, isTokenExpired } = await import(
        '@encrypted-notes/common'
      );

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'valid-token';
        return null;
      });

      (isTokenExpired as any).mockReturnValue(false);
      (getUserFromToken as any).mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('token')).toHaveTextContent('valid-token');
        expect(screen.getByTestId('user')).toHaveTextContent(
          JSON.stringify({ id: 'user-1', email: 'test@example.com' })
        );
      });
    });

    it('should remove expired token from localStorage', async () => {
      const { isTokenExpired } = await import('@encrypted-notes/common');

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'expired-token';
        return null;
      });

      (isTokenExpired as any).mockReturnValue(true);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('wrapped_umk');
      });
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const user = userEvent.setup();
      const { getUserFromToken } = await import('@encrypted-notes/common');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'new-token' }),
      });

      (getUserFromToken as any).mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByRole('button', { name: 'Login' });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'auth_token',
          'new-token'
        );
        expect(screen.getByTestId('token')).toHaveTextContent('new-token');
      });
    });

    it('should handle login failure', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByRole('button', { name: 'Login' });
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('null');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const user = userEvent.setup();
      const { getUserFromToken } = await import('@encrypted-notes/common');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'new-token' }),
      });

      (getUserFromToken as any).mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      const registerButton = screen.getByRole('button', { name: 'Register' });
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        });
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'auth_token',
          'new-token'
        );
      });
    });
  });

  describe('logout', () => {
    it('should clear user data and localStorage', async () => {
      const user = userEvent.setup();

      // Set up initial logged in state
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'valid-token';
        return null;
      });

      const { getUserFromToken, isTokenExpired } = await import(
        '@encrypted-notes/common'
      );
      (isTokenExpired as any).mockReturnValue(false);
      (getUserFromToken as any).mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('valid-token');
      });

      const logoutButton = screen.getByRole('button', { name: 'Logout' });
      await user.click(logoutButton);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('wrapped_umk');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  describe('error handling', () => {
    it('should throw error when useAuth is used outside provider', () => {
      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );
    });
  });
});
