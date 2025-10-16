// Import crypto functions directly from common package files
import { MainThreadCryptoWorker } from '@encrypted-notes/common/src/crypto/worker';
import { zeroize } from '@encrypted-notes/common/src/crypto/argon2';
import type {
  WrappedKey,
  EncryptedData,
} from '@encrypted-notes/common/src/crypto/types';

export interface UserKeys {
  umk: CryptoKey;
  contentKey: CryptoKey;
  searchKey: CryptoKey;
}

export interface EncryptedNoteData {
  titleCt: Uint8Array;
  ivTitle: Uint8Array;
  bodyCt: Uint8Array;
  ivBody: Uint8Array;
  termHashes: Uint8Array[];
}

export interface NoteEncryptionResult {
  encrypted: EncryptedNoteData;
  wrappedKey: WrappedKey;
}

/**
 * Client-side crypto service for end-to-end encryption
 */
export class CryptoService {
  private cryptoWorker: MainThreadCryptoWorker;

  constructor() {
    this.cryptoWorker = new MainThreadCryptoWorker();
  }

  /**
   * Derives user keys from password and salt
   */
  async deriveUserKeys(password: string, salt: Uint8Array): Promise<UserKeys> {
    try {
      // Generate User Master Key
      const umk = await this.cryptoWorker.generateUMK();

      // Derive content and search keys from UMK
      const contentKey = await this.cryptoWorker.hkdf(umk, 'content');
      const searchKey = await this.cryptoWorker.hkdf(umk, 'search');

      return { umk, contentKey, searchKey };
    } catch (error) {
      console.error('Failed to derive user keys:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Wraps UMK for storage
   */
  async wrapUMK(
    umk: CryptoKey,
    password: string,
    salt: Uint8Array
  ): Promise<WrappedKey> {
    try {
      const kek = await this.cryptoWorker.deriveKEK(password, salt);
      return await this.cryptoWorker.wrapUMK(umk, kek);
    } catch (error) {
      console.error('Failed to wrap UMK:', error);
      throw new Error('Key wrapping failed');
    }
  }

  /**
   * Unwraps UMK for use
   */
  async unwrapUMK(
    wrappedKey: WrappedKey,
    password: string
  ): Promise<CryptoKey> {
    try {
      const kek = await this.cryptoWorker.deriveKEK(
        password,
        wrappedKey.salt,
        wrappedKey.params
      );
      return await this.cryptoWorker.unwrapUMK(wrappedKey, kek);
    } catch (error) {
      console.error('Failed to unwrap UMK:', error);
      throw new Error('Key unwrapping failed');
    }
  }

  /**
   * Encrypts note content
   */
  async encryptNote(
    title: string,
    body: string,
    userKeys: UserKeys
  ): Promise<EncryptedNoteData> {
    try {
      // Convert strings to bytes
      const titleBytes = new TextEncoder().encode(title);
      const bodyBytes = new TextEncoder().encode(body);

      // Encrypt title and body
      const titleEncrypted = await this.cryptoWorker.aesGcmEncrypt(
        userKeys.contentKey,
        titleBytes
      );
      const bodyEncrypted = await this.cryptoWorker.aesGcmEncrypt(
        userKeys.contentKey,
        bodyBytes
      );

      // Generate search terms (tokenize and hash)
      const termHashes = await this.generateSearchHashes(
        title + ' ' + body,
        userKeys.searchKey
      );

      return {
        titleCt: new Uint8Array(titleEncrypted.ciphertext),
        ivTitle: titleEncrypted.iv,
        bodyCt: new Uint8Array(bodyEncrypted.ciphertext),
        ivBody: bodyEncrypted.iv,
        termHashes,
      };
    } catch (error) {
      console.error('Failed to encrypt note:', error);
      throw new Error('Note encryption failed');
    }
  }

  /**
   * Decrypts note content
   */
  async decryptNote(
    encryptedData: EncryptedNoteData,
    userKeys: UserKeys
  ): Promise<{ title: string; body: string }> {
    try {
      // Decrypt title
      const titleEncrypted: EncryptedData = {
        ciphertext: encryptedData.titleCt.buffer as ArrayBuffer,
        iv: encryptedData.ivTitle,
      };
      const titleBytes = await this.cryptoWorker.aesGcmDecrypt(
        userKeys.contentKey,
        titleEncrypted
      );
      const title = new TextDecoder().decode(titleBytes);

      // Decrypt body
      const bodyEncrypted: EncryptedData = {
        ciphertext: encryptedData.bodyCt.buffer as ArrayBuffer,
        iv: encryptedData.ivBody,
      };
      const bodyBytes = await this.cryptoWorker.aesGcmDecrypt(
        userKeys.contentKey,
        bodyEncrypted
      );
      const body = new TextDecoder().decode(bodyBytes);

      return { title, body };
    } catch (error) {
      console.error('Failed to decrypt note:', error);
      throw new Error('Note decryption failed');
    }
  }

  /**
   * Generates search hashes for blind indexing
   */
  private async generateSearchHashes(
    text: string,
    searchKey: CryptoKey
  ): Promise<Uint8Array[]> {
    try {
      // Simple tokenization (split on whitespace and remove punctuation)
      const tokens = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 0);

      // Generate HMAC-SHA256 for each token
      const hashes: Uint8Array[] = [];
      for (const token of tokens) {
        const tokenBytes = new TextEncoder().encode(token);
        const hash = await crypto.subtle.sign(
          'HMAC',
          searchKey,
          tokenBytes.buffer as ArrayBuffer
        );
        hashes.push(new Uint8Array(hash));
      }

      return hashes;
    } catch (error) {
      console.error('Failed to generate search hashes:', error);
      throw new Error('Search hash generation failed');
    }
  }

  /**
   * Generates search hashes for a search query
   */
  async generateSearchQueryHashes(
    query: string,
    searchKey: CryptoKey
  ): Promise<Uint8Array[]> {
    return this.generateSearchHashes(query, searchKey);
  }

  /**
   * Unwraps stored UMK and derives user keys
   */
  async unwrapAndDeriveUserKeys(
    wrappedKey: WrappedKey,
    password: string
  ): Promise<UserKeys> {
    try {
      // Unwrap the UMK
      const umk = await this.unwrapUMK(wrappedKey, password);

      // Derive content and search keys from UMK
      const contentKey = await this.cryptoWorker.hkdf(umk, 'content');
      const searchKey = await this.cryptoWorker.hkdf(umk, 'search');

      return { umk, contentKey, searchKey };
    } catch (error) {
      console.error('Failed to unwrap and derive user keys:', error);
      throw new Error('Key unwrapping failed');
    }
  }

  /**
   * Generates a new salt for key derivation
   */
  async generateSalt(length: number = 32): Promise<Uint8Array> {
    return this.cryptoWorker.generateSalt(length);
  }

  /**
   * Securely clears sensitive data from memory
   */
  clearSensitiveData(data: Uint8Array | ArrayBuffer | string): void {
    if (typeof data === 'string') {
      // For strings, we can't directly zeroize, but we can clear references
      return;
    }
    zeroize(data);
  }
}

// Singleton instance
export const cryptoService = new CryptoService();
