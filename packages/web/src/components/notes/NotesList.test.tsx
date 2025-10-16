import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NotesList } from './NotesList';
import { useAuth } from '../../hooks/useAuth';
import { NotesListResponse } from '@encrypted-notes/common';

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
  };
});

const mockUseAuth = vi.mocked(useAuth);
const mockUseNavigate = vi.mocked(await import('react-router-dom')).useNavigate;

describe('NotesList', () => {
  const mockNavigate = vi.fn();
  const mockToken = 'mock-jwt-token';

  const mockNotes: NotesListResponse['notes'] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-02T10:00:00Z'),
    },
    {
      id: '987fcdeb-51a2-43d7-8f9e-123456789abc',
      created_at: new Date('2023-01-03T10:00:00Z'),
      updated_at: new Date('2023-01-04T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      token: mockToken,
      userKeys: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <NotesList />
      </BrowserRouter>
    );

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows generic error message for unknown errors', async () => {
      (global.fetch as any).mockRejectedValueOnce('Unknown error');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('An error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no notes exist', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: [], nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No notes yet')).toBeInTheDocument();
        expect(
          screen.getByText('Create your first encrypted note to get started.')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /create note/i })
        ).toBeInTheDocument();
      });
    });

    it('navigates to new note page when create note button is clicked', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: [], nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create note/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create note/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/notes/new');
    });
  });

  describe('Notes List', () => {
    it('renders notes list with correct information', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Your Notes (2)')).toBeInTheDocument();
      });

      // Check note cards
      expect(screen.getByText('Note 123e4567...')).toBeInTheDocument();
      expect(screen.getByText('Note 987fcdeb...')).toBeInTheDocument();

      // Check dates are formatted
      expect(screen.getAllByText(/Created:/)).toHaveLength(2);
      expect(screen.getAllByText(/Updated:/)).toHaveLength(2);
    });

    it('navigates to note detail when note card is clicked', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Note 123e4567...')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Note 123e4567...').closest('div')!);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/notes/123e4567-e89b-12d3-a456-426614174000'
      );
    });

    it('shows new note button in header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /new note/i })
        ).toBeInTheDocument();
      });
    });

    it('navigates to new note page when new note button is clicked', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /new note/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /new note/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/notes/new');
    });
  });

  describe('Pagination', () => {
    it('shows pagination when nextCursor exists', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: 'next-page-cursor' }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument(); // Pagination component
      });
    });

    it('does not show pagination when no nextCursor', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('makes correct API call with token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/notes?limit=20'),
          {
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });

    it('refetches notes when pagination is clicked', async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ notes: mockNotes, nextCursor: 'cursor-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Click page 2 button (triggers refetch from beginning)
      const page2Button = screen.getByRole('button', { name: 'Go to page 2' });
      await user.click(page2Button);

      await waitFor(() => {
        // Should have made 2 API calls total
        expect(global.fetch).toHaveBeenCalledTimes(2);
        // Second call should be without cursor (simplified pagination)
        expect(global.fetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/notes?limit=20'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Floating Action Button', () => {
    it('renders FAB for mobile view', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ notes: mockNotes, nextCursor: undefined }),
      });

      renderComponent();

      await waitFor(() => {
        const fab = screen.getByRole('button', { name: /add note/i });
        expect(fab).toBeInTheDocument();
        expect(fab).toHaveAttribute('aria-label', 'add note');
      });
    });
  });
});
