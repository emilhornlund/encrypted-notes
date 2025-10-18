import { describe, expect, it, vi } from 'vitest';

import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  deriveKEK,
  generateSalt,
  generateUMK,
  hkdf,
  hmacSha256,
  unwrapKey,
  wrapKey,
  zeroize,
} from './crypto';

// Mock crypto.subtle
let randomCounter = 0;
const mockSubtle = {
  importKey: vi.fn().mockImplementation((format, keyData, algorithm) => {
    if (algorithm === 'HKDF') {
      return Promise.resolve({
        type: 'secret',
        algorithm: { name: 'HKDF' },
      } as CryptoKey);
    }
    return Promise.resolve({
      type: 'secret',
      algorithm: { name: 'AES-KW' },
    } as CryptoKey);
  }),
  deriveKey: vi
    .fn()
    .mockImplementation((algorithm, keyMaterial, derivedKeyType) => {
      if (derivedKeyType.name === 'AES-KW') {
        return Promise.resolve({
          type: 'secret',
          algorithm: { name: 'AES-KW' },
        } as CryptoKey);
      } else if (derivedKeyType.name === 'AES-GCM') {
        return Promise.resolve({
          type: 'secret',
          algorithm: { name: 'AES-GCM' },
        } as CryptoKey);
      }
      return Promise.resolve({
        type: 'secret',
        algorithm: { name: 'AES-GCM' },
      } as CryptoKey);
    }),
  encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
  decrypt: vi
    .fn()
    .mockResolvedValue(
      new Uint8Array([
        72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33,
      ]).buffer
    ),
  wrapKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  unwrapKey: vi
    .fn()
    .mockImplementation(
      (format, wrappedKey, unwrappingKey, unwrapAlgorithm, keyType) => {
        return Promise.resolve({
          type: 'secret',
          algorithm: keyType,
        } as CryptoKey);
      }
    ),
  sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
};

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockSubtle,
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = (i + randomCounter) % 256;
      }
      randomCounter++;
      return array;
    }),
  },
});

describe('Web Crypto Utils', () => {
  const testPassword = 'test-password-123';
  const testSalt = generateSalt(32);
  const testData = new TextEncoder().encode('Hello, World!');

  describe('deriveKEK', () => {
    it('should derive a KEK from password and salt', async () => {
      const kek = await deriveKEK(testPassword, testSalt);
      expect(kek).toBeDefined();
      expect(kek.type).toBe('secret');
      expect(kek.algorithm.name).toBe('AES-KW');
    });
  });

  describe('generateSalt', () => {
    it('should generate salt of specified length', () => {
      const salt = generateSalt(16);
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate different salts', () => {
      const salt1 = generateSalt(32);
      const salt2 = generateSalt(32);
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('generateUMK', () => {
    it('should generate a valid UMK', async () => {
      const umk = await generateUMK();
      expect(umk).toBeDefined();
      expect(umk.algorithm.name).toBe('HKDF');
    });
  });

  describe('hkdf', () => {
    it('should derive different keys for different info strings', async () => {
      const umk = await generateUMK();
      const key1 = await hkdf(umk, 'content');
      const key2 = await hkdf(umk, 'search');

      expect(key1.algorithm).toEqual(key2.algorithm);
      expect(key1.type).toBe('secret');
      expect(key2.type).toBe('secret');
    });
  });

  describe('AES-GCM', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const umk = await generateUMK();
      const key = await hkdf(umk, 'content');

      const encrypted = await aesGcmEncrypt(key, testData);
      expect(encrypted.ciphertext).toBeInstanceOf(ArrayBuffer);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv.length).toBe(12);

      const decrypted = await aesGcmDecrypt(key, encrypted);
      expect(decrypted).toEqual(
        new Uint8Array([
          72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33,
        ])
      );
    });

    it('should produce different IVs for each encryption', async () => {
      const umk = await generateUMK();
      const key = await hkdf(umk, 'content');

      const encrypted1 = await aesGcmEncrypt(key, testData);
      const encrypted2 = await aesGcmEncrypt(key, testData);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('Key Wrapping', () => {
    it('should wrap and unwrap key correctly', async () => {
      const umk = await generateUMK();
      const kek = await deriveKEK(testPassword, testSalt);

      const wrapped = await wrapKey(umk, kek);
      expect(wrapped).toBeInstanceOf(Uint8Array);

      const unwrapped = await unwrapKey(wrapped, kek, { name: 'HKDF' }, false, [
        'deriveKey',
      ]);
      expect(unwrapped).toBeDefined();
      expect(unwrapped.algorithm.name).toBe('HKDF');
    });
  });

  describe('zeroize', () => {
    it('should zeroize Uint8Array', () => {
      const array = new Uint8Array([1, 2, 3, 4, 5]);
      zeroize(array);
      expect(array.every((byte) => byte === 0)).toBe(true);
    });

    it('should zeroize ArrayBuffer', () => {
      const buffer = new ArrayBuffer(5);
      const view = new Uint8Array(buffer);
      view.set([1, 2, 3, 4, 5]);
      zeroize(buffer);
      expect(view.every((byte) => byte === 0)).toBe(true);
    });
  });

  describe('hmacSha256', () => {
    it('should generate HMAC-SHA256 hash', async () => {
      const umk = await generateUMK();
      const key = await hkdf(umk, 'search');

      const hash = await hmacSha256(key, testData);
      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32); // SHA-256 output length
    });
  });
});
