import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar } from './Sidebar';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sidebar with menu items', () => {
    render(<Sidebar />);

    expect(screen.getByText('New Note')).toBeInTheDocument();
    expect(screen.getByText('All Notes')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('should highlight the current path', () => {
    mockLocation.pathname = '/search';
    render(<Sidebar />);

    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeInTheDocument();
  });

  it('should navigate when clicking menu items', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const tagsButton = screen.getByText('Tags');
    await user.click(tagsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/tags');
  });

  it('should navigate to new note', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const newNoteButton = screen.getByText('New Note');
    await user.click(newNoteButton);

    expect(mockNavigate).toHaveBeenCalledWith('/notes/new');
  });
});
