import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    token: 'mock-token',
    userKeys: { umk: {}, contentKey: {}, searchKey: {} },
  })),
}));

// Mock crypto service
vi.mock('../../services/crypto.service', () => ({
  cryptoService: {
    encryptNote: vi.fn(),
    decryptNote: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

import { NoteEditor } from './NoteEditor';

describe('NoteEditor', () => {
  it('renders without crashing', () => {
    render(<NoteEditor />);
    // Basic smoke test - component renders without crashing
    expect(true).toBe(true);
  });
});
