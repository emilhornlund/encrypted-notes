import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { useAuth } from '../../hooks/useAuth';
import { MainLayout } from './AppShell';

// Mock the hooks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock the components
vi.mock('../notes/NoteEditor', () => ({
  NoteEditor: () => <div>NoteEditor</div>,
}));

vi.mock('../notes/NotesList', () => ({
  NotesList: () => <div>NotesList</div>,
}));

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

describe('MainLayout', () => {
  const mockUseAuth = vi.mocked(useAuth);

  it('should render the main layout with user email', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Encrypted Notes')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
  });

  it('should render NotesList on root path', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('NotesList')).toBeInTheDocument();
  });

  it('should render NoteEditor on /notes/new path', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('NoteEditor')).toBeInTheDocument();
  });

  it('should render TagsPage on /tags path', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      token: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/tags']}>
        <MainLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Tags Page - Coming Soon')).toBeInTheDocument();
  });
});
