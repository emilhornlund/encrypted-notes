import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginForm';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useNavigate: vi.fn(),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useAuth } = await import('../../hooks/useAuth');
    const { useNavigate } = await import('react-router-dom');

    (useAuth as any).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });

    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: 'Sign In' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Email Address' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(
      screen.getByText("Don't have an account? Sign Up")
    ).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should show loading state during login', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: 'Signing In...' });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Login failed'));

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Login failed. Please check your credentials.')
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderComponent();

    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.click(submitButton);

    // HTML5 validation should prevent submission with empty required fields
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should navigate to register page when link is clicked', () => {
    renderComponent();

    const registerLink = screen.getByText("Don't have an account? Sign Up");
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');

    // Note: We don't click the link as it would cause navigation in a real app
    // The href attribute check ensures the link is configured correctly
  });
});
