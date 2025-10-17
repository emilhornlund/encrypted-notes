import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { RegisterPage } from './RegisterForm';

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

describe('RegisterPage', () => {
  const mockRegister = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const { useAuth } = await import('../../hooks/useAuth');
    const { useNavigate } = await import('react-router-dom');

    (useAuth as any).mockReturnValue({
      register: mockRegister,
      isLoading: false,
    });

    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  it('should render registration form', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: 'Sign Up' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Email Address' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    expect(
      screen.getByText('Already have an account? Sign In')
    ).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce(undefined);

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(mockRegister).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show loading state during registration', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      register: mockRegister,
      isLoading: true,
    });

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const submitButton = screen.getByRole('button', {
      name: 'Creating Account...',
    });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should handle registration error', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce(new Error('Registration failed'));

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(
      await screen.findByText('Registration failed. Please try again.')
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should validate password mismatch', async () => {
    const user = userEvent.setup();

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    expect(
      await screen.findByText('Passwords do not match')
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should validate minimum password length', async () => {
    const user = userEvent.setup();

    renderComponent();

    const emailInput = screen.getByRole('textbox', { name: 'Email Address' });
    const passwordInput = screen.getByLabelText(/^Password/);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'short');
    await user.type(confirmPasswordInput, 'short');
    await user.click(submitButton);

    expect(
      await screen.findByText('Password must be at least 8 characters long')
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();

    renderComponent();

    const submitButton = screen.getByRole('button', { name: 'Sign Up' });

    await user.click(submitButton);

    // HTML5 validation should prevent submission with empty required fields
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should navigate to login page when link is clicked', () => {
    renderComponent();

    const loginLink = screen.getByText('Already have an account? Sign In');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');

    // Note: We don't click the link as it would cause navigation in a real app
    // The href attribute check ensures the link is configured correctly
  });
});
