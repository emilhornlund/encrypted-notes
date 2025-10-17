import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { PrivateRoute } from './PrivateRoute';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (
    children: React.ReactNode = <div>Test Content</div>
  ) => {
    return render(
      <MemoryRouter>
        <PrivateRoute>{children}</PrivateRoute>
      </MemoryRouter>
    );
  };

  it('should show loading spinner when authentication is loading', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      user: null,
      isLoading: true,
    });

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      user: null,
      isLoading: false,
    });

    renderComponent();

    // The component should redirect, so the test content should not be visible
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle authenticated user with custom children', async () => {
    const { useAuth } = await import('../../hooks/useAuth');
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      isLoading: false,
    });

    renderComponent(<div>Custom Protected Content</div>);

    expect(screen.getByText('Custom Protected Content')).toBeInTheDocument();
  });
});
