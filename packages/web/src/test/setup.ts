import '@testing-library/jest-dom';

import { vi } from 'vitest';

// Mock fetch globally with default successful responses
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ accessToken: 'mock-token' }),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((array) => {
      // Fill array with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    }),
  },
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock crypto service for faster tests
vi.mock('../services/crypto.service', () => ({
  cryptoService: {
    deriveUserKeys: vi.fn().mockResolvedValue({
      umk: {} as CryptoKey,
      contentKey: {} as CryptoKey,
      searchKey: {} as CryptoKey,
    }),
    wrapUMK: vi.fn().mockResolvedValue({
      wrappedKey: new Uint8Array([1, 2, 3]),
      salt: new Uint8Array([4, 5, 6]),
      params: { m: 1024, t: 1, p: 1 },
    }),
    unwrapUMK: vi.fn().mockResolvedValue({} as CryptoKey),
    unwrapAndDeriveUserKeys: vi.fn().mockResolvedValue({
      umk: {} as CryptoKey,
      contentKey: {} as CryptoKey,
      searchKey: {} as CryptoKey,
    }),
    generateSalt: vi.fn().mockResolvedValue(new Uint8Array(32)),
    encryptNote: vi.fn().mockResolvedValue({
      encrypted: {
        titleCt: new Uint8Array([1, 2, 3]),
        ivTitle: new Uint8Array(12),
        bodyCt: new Uint8Array([4, 5, 6]),
        ivBody: new Uint8Array(12),
        termHashes: [new Uint8Array([7, 8, 9])],
      },
      wrappedKey: {
        wrappedKey: new Uint8Array([1, 2, 3]),
        salt: new Uint8Array([4, 5, 6]),
        params: { m: 1024, t: 1, p: 1 },
      },
    }),
    decryptNote: vi.fn().mockResolvedValue({
      title: 'Test Title',
      body: 'Test Body',
    }),
    generateSearchQueryHashes: vi
      .fn()
      .mockResolvedValue([new Uint8Array([1, 2, 3])]),
    clearSensitiveData: vi.fn(),
  },
}));
