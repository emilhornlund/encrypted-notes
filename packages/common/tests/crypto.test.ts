import { describe, it, expect, beforeAll } from 'vitest';
import {
  deriveKEK,
  generateSalt,
  aesGcmEncrypt,
  aesGcmDecrypt,
  hkdf,
  generateUMK,
  zeroize,
} from '../src/crypto';

describe('Crypto Utilities', () => {
  const testPassword = 'test-password-123';
  const testSalt = generateSalt(32);
  const testData = new TextEncoder().encode('Hello, World!');

  let kek: CryptoKey;
  let contentKey: CryptoKey;

  beforeAll(async () => {
    kek = await deriveKEK(testPassword, testSalt);
    const umk = await generateUMK();
    contentKey = await hkdf(umk, 'content');
  });

  describe('deriveKEK', () => {
    it('should derive a KEK from password and salt', async () => {
      expect(kek).toBeInstanceOf(CryptoKey);
      expect(kek.type).toBe('secret');
      expect(kek.algorithm.name).toBe('AES-KW');
    });

    it('should produce consistent results with same inputs', async () => {
      const kek2 = await deriveKEK(testPassword, testSalt);
      const exported1 = await crypto.subtle.exportKey('raw', kek);
      const exported2 = await crypto.subtle.exportKey('raw', kek2);
      expect(exported1).toEqual(exported2);
    });
  });

  describe('AES-GCM', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await aesGcmEncrypt(contentKey, testData);
      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.iv.length).toBe(12);

      const decrypted = await aesGcmDecrypt(contentKey, encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const encrypted1 = await aesGcmEncrypt(contentKey, testData);
      const encrypted2 = await aesGcmEncrypt(contentKey, testData);
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('HKDF', () => {
    it('should derive different keys for different info strings', async () => {
      const umk = await generateUMK();
      const key1 = await hkdf(umk, 'content');
      const key2 = await hkdf(umk, 'search');

      const exported1 = await crypto.subtle.exportKey('raw', key1);
      const exported2 = await crypto.subtle.exportKey('raw', key2);
      expect(exported1).not.toEqual(exported2);
    });
  });

  describe('zeroize', () => {
    it('should zeroize Uint8Array', () => {
      const array = new Uint8Array([1, 2, 3, 4, 5]);
      zeroize(array);
      expect(array.every(byte => byte === 0)).toBe(true);
    });

    it('should zeroize ArrayBuffer', () => {
      const buffer = new ArrayBuffer(5);
      const view = new Uint8Array(buffer);
      view.set([1, 2, 3, 4, 5]);
      zeroize(buffer);
      expect(view.every(byte => byte === 0)).toBe(true);
    });
  });
});