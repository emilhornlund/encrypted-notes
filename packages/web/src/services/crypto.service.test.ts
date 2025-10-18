// Mock the common crypto worker
vi.mock('@encrypted-notes/common', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    MainThreadCryptoWorker: vi.fn().mockImplementation(() => ({
      generateUMK: vi.fn(),
      hkdf: vi.fn(),
      deriveKEK: vi.fn(),
      wrapUMK: vi.fn(),
      unwrapUMK: vi.fn(),
      aesGcmEncrypt: vi.fn(),
      aesGcmDecrypt: vi.fn(),
      generateSalt: vi.fn(),
    })),
    zeroize: vi.fn(),
  };
});

vi.mock('./crypto.service', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

import { zeroize } from '@encrypted-notes/common';
import { describe, expect, it, vi } from 'vitest';

import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;
  let mockWorker: any;

  beforeEach(() => {
    service = new CryptoService();
    mockWorker = (service as any).cryptoWorker;
    // Clear mocks
    mockWorker.generateUMK.mockClear();
    mockWorker.hkdf.mockClear();
    mockWorker.deriveKEK.mockClear();
    mockWorker.wrapUMK.mockClear();
    mockWorker.unwrapUMK.mockClear();
    mockWorker.aesGcmEncrypt.mockClear();
    mockWorker.aesGcmDecrypt.mockClear();
    mockWorker.generateSalt.mockClear();
    zeroize.mockClear();
  });

  describe('deriveUserKeys', () => {
    it('should derive user keys successfully', async () => {
      const mockUmk = {} as CryptoKey;
      const mockContentKey = {} as CryptoKey;
      const mockSearchKey = {} as CryptoKey;

      mockWorker.generateUMK.mockResolvedValue(mockUmk);
      mockWorker.hkdf
        .mockResolvedValueOnce(mockContentKey)
        .mockResolvedValueOnce(mockSearchKey);

      const result = await service.deriveUserKeys(
        'password',
        new Uint8Array(32)
      );

      expect(mockWorker.generateUMK).toHaveBeenCalled();
      expect(mockWorker.hkdf).toHaveBeenCalledWith(mockUmk, 'content');
      expect(mockWorker.hkdf).toHaveBeenCalledWith(mockUmk, 'search');
      expect(result).toEqual({
        umk: mockUmk,
        contentKey: mockContentKey,
        searchKey: mockSearchKey,
      });
    });

    it('should throw error on failure', async () => {
      mockWorker.generateUMK.mockRejectedValue(new Error('Crypto error'));

      await expect(
        service.deriveUserKeys('password', new Uint8Array(32))
      ).rejects.toThrow('Key derivation failed');
    });
  });

  describe('wrapUMK', () => {
    it('should wrap UMK successfully', async () => {
      const mockUmk = {} as CryptoKey;
      const mockKek = {} as CryptoKey;
      const mockWrapped = {
        wrappedKey: new Uint8Array(32),
        salt: new Uint8Array(32),
        params: {},
      };

      mockWorker.deriveKEK.mockResolvedValue(mockKek);
      mockWorker.wrapUMK.mockResolvedValue(mockWrapped);

      const result = await service.wrapUMK(
        mockUmk,
        'password',
        new Uint8Array(32)
      );

      expect(mockWorker.deriveKEK).toHaveBeenCalledWith(
        'password',
        new Uint8Array(32)
      );
      expect(mockWorker.wrapUMK).toHaveBeenCalledWith(mockUmk, mockKek);
      expect(result).toEqual(mockWrapped);
    });
  });

  describe('unwrapUMK', () => {
    it('should unwrap UMK successfully', async () => {
      const mockWrapped = {
        wrappedKey: new Uint8Array(32),
        salt: new Uint8Array(32),
        params: { m: 131072, t: 3, p: 1 },
      };
      const mockKek = {} as CryptoKey;
      const mockUmk = {} as CryptoKey;

      mockWorker.deriveKEK.mockResolvedValue(mockKek);
      mockWorker.unwrapUMK.mockResolvedValue(mockUmk);

      const result = await service.unwrapUMK(mockWrapped, 'password');

      expect(mockWorker.deriveKEK).toHaveBeenCalledWith(
        'password',
        mockWrapped.salt,
        mockWrapped.params
      );
      expect(mockWorker.unwrapUMK).toHaveBeenCalledWith(mockWrapped, mockKek);
      expect(result).toEqual(mockUmk);
    });
  });

  describe('encryptNote', () => {
    it('should encrypt note successfully', async () => {
      const mockUserKeys = {
        contentKey: {} as CryptoKey,
        searchKey: {} as CryptoKey,
      };
      const mockTitleEncrypted = {
        ciphertext: new ArrayBuffer(16),
        iv: new Uint8Array(12),
      };
      const mockBodyEncrypted = {
        ciphertext: new ArrayBuffer(16),
        iv: new Uint8Array(12),
      };

      mockWorker.aesGcmEncrypt
        .mockResolvedValueOnce(mockTitleEncrypted)
        .mockResolvedValueOnce(mockBodyEncrypted);

      // Mock generateSearchHashes
      vi.spyOn(service as any, 'generateSearchHashes').mockResolvedValue([
        new Uint8Array(32),
      ]);

      const result = await service.encryptNote('Title', 'Body', mockUserKeys);

      expect(mockWorker.aesGcmEncrypt).toHaveBeenCalledTimes(2);
      expect(result.titleCt).toBeInstanceOf(Uint8Array);
      expect(result.bodyCt).toBeInstanceOf(Uint8Array);
      expect(result.termHashes).toHaveLength(1);
    });
  });

  describe('decryptNote', () => {
    it('should decrypt note successfully', async () => {
      const mockUserKeys = {
        contentKey: {} as CryptoKey,
      };
      const mockEncryptedData = {
        titleCt: new Uint8Array(16),
        ivTitle: new Uint8Array(12),
        bodyCt: new Uint8Array(16),
        ivBody: new Uint8Array(12),
        termHashes: [],
      };

      mockWorker.aesGcmDecrypt
        .mockResolvedValueOnce(new TextEncoder().encode('Title'))
        .mockResolvedValueOnce(new TextEncoder().encode('Body'));

      const result = await service.decryptNote(mockEncryptedData, mockUserKeys);

      expect(mockWorker.aesGcmDecrypt).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ title: 'Title', body: 'Body' });
    });
  });

  describe('generateSalt', () => {
    it('should generate salt', async () => {
      const mockSalt = new Uint8Array(32);
      mockWorker.generateSalt.mockResolvedValue(mockSalt);

      const result = await service.generateSalt(32);

      expect(mockWorker.generateSalt).toHaveBeenCalledWith(32);
      expect(result).toEqual(mockSalt);
    });
  });

  describe('clearSensitiveData', () => {
    it('should zeroize Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3]);

      service.clearSensitiveData(data);

      expect(zeroize).toHaveBeenCalledWith(data);
    });

    it('should handle strings', () => {
      const data = 'sensitive';

      service.clearSensitiveData(data);

      expect(zeroize).not.toHaveBeenCalled();
    });
  });
});
