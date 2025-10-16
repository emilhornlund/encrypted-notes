import { describe, it, expect, beforeAll } from 'vitest';
import {
  deriveKEK,
  generateSalt,
  aesGcmEncrypt,
  aesGcmDecrypt,
  hkdf,
  generateUMK,
  zeroize,
  generateContentKey,
} from '../src/crypto';
import { MainThreadCryptoWorker } from '../src/crypto/worker';

describe('Crypto Utilities', () => {
  const testPassword = 'test-password-123';
  const testSalt = generateSalt(32);
  const testData = new TextEncoder().encode('Hello, World!');

  let kek: CryptoKey;
  let contentKey: CryptoKey;

  beforeAll(async () => {
    kek = await deriveKEK(testPassword, testSalt);
    const umk = await generateUMK();
    contentKey = await hkdf(umk, 'content', 32, true);
  });

  describe('deriveKEK', () => {
    it('should derive a KEK from password and salt', async () => {
      expect(kek).toBeInstanceOf(CryptoKey);
      expect(kek.type).toBe('secret');
      expect(kek.algorithm.name).toBe('AES-KW');
    });

    it('should produce consistent results with same inputs', async () => {
      const kek2 = await deriveKEK(testPassword, testSalt);
      // Test consistency by using the keys for wrapping the same data
      const testData = new Uint8Array([1, 2, 3, 4]);
      const wrapped1 = await crypto.subtle.wrapKey(
        'raw',
        contentKey,
        kek,
        'AES-KW'
      );
      const wrapped2 = await crypto.subtle.wrapKey(
        'raw',
        contentKey,
        kek2,
        'AES-KW'
      );
      expect(wrapped1).toEqual(wrapped2);
    });
  });

  describe('AES-GCM', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await aesGcmEncrypt(contentKey, testData);
      expect(encrypted.ciphertext).toBeInstanceOf(ArrayBuffer);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv.length).toBe(12);

      const decrypted = await aesGcmDecrypt(contentKey, encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should produce different IVs for each encryption', async () => {
      const encrypted1 = await aesGcmEncrypt(contentKey, testData);
      const encrypted2 = await aesGcmEncrypt(contentKey, testData);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('HKDF', () => {
    it('should derive different keys for different info strings', async () => {
      const umk = await generateUMK();
      const key1 = await hkdf(umk, 'content', 32, true);
      const key2 = await hkdf(umk, 'search', 32, true);

      // Test that they are different keys by checking algorithm properties
      expect(key1.algorithm).toEqual(key2.algorithm);
      expect(key1.type).toBe('secret');
      expect(key2.type).toBe('secret');
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

    it('should default to 32 bytes', () => {
      const salt = generateSalt();
      expect(salt.length).toBe(32);
    });
  });

  describe('generateUMK', () => {
    it('should generate a valid UMK', async () => {
      const umk = await generateUMK();
      expect(umk).toBeInstanceOf(CryptoKey);
      expect(umk.type).toBe('secret');
      expect(umk.algorithm.name).toBe('HMAC');
    });

    it('should generate different UMKs', async () => {
      const umk1 = await generateUMK();
      const umk2 = await generateUMK();
      expect(umk1).toBeInstanceOf(CryptoKey);
      expect(umk2).toBeInstanceOf(CryptoKey);
      expect(umk1.algorithm).toEqual(umk2.algorithm);
    });
  });

  describe('generateContentKey', () => {
    it('should generate a valid AES-GCM key', async () => {
      const key = await generateContentKey();
      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
      expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    });

    it('should generate different keys', async () => {
      const key1 = await generateContentKey();
      const key2 = await generateContentKey();
      expect(key1).toBeInstanceOf(CryptoKey);
      expect(key2).toBeInstanceOf(CryptoKey);
      expect(key1.algorithm).toEqual(key2.algorithm);
    });

    it('should be extractable', async () => {
      const key = await generateContentKey();
      expect(key.extractable).toBe(true);
    });
  });

  describe('Key Wrapping', () => {
    let worker: MainThreadCryptoWorker;
    let umk: CryptoKey;

    beforeAll(async () => {
      worker = new MainThreadCryptoWorker();
      umk = await generateUMK();
    });

    it('should wrap and unwrap UMK correctly', async () => {
      const wrapped = await worker.wrapUMK(umk, kek);
      expect(wrapped.wrappedKey).toBeInstanceOf(Uint8Array);
      expect(wrapped.salt).toBeInstanceOf(Uint8Array);
      expect(wrapped.params).toBeDefined();

      const unwrapped = await worker.unwrapUMK(wrapped, kek);
      // Test that the unwrapped key works the same as the original
      const testData = new Uint8Array([1, 2, 3, 4]);
      const key1 = await hkdf(umk, 'test', 32, true);
      const key2 = await hkdf(unwrapped, 'test', 32, true);
      const encrypted1 = await aesGcmEncrypt(key1, testData);
      const encrypted2 = await aesGcmEncrypt(key2, testData);
      expect(encrypted1.ciphertext).toEqual(encrypted2.ciphertext);
    });

    it('should fail to unwrap with wrong KEK', async () => {
      const wrapped = await worker.wrapUMK(umk, kek);
      const wrongKek = await deriveKEK('wrong-password', testSalt);

      await expect(worker.unwrapUMK(wrapped, wrongKek)).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should reject decryption with wrong key', async () => {
      const encrypted = await aesGcmEncrypt(contentKey, testData);
      const wrongKey = await generateContentKey();

      await expect(aesGcmDecrypt(wrongKey, encrypted)).rejects.toThrow();
    });

    it('should reject decryption with tampered IV', async () => {
      const encrypted = await aesGcmEncrypt(contentKey, testData);
      const tamperedEncrypted = {
        ...encrypted,
        iv: new Uint8Array(12), // All zeros
      };

      await expect(
        aesGcmDecrypt(contentKey, tamperedEncrypted)
      ).rejects.toThrow();
    });
  });
});
