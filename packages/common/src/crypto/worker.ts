import { WrappedKey, Argon2Params, EncryptedData } from './types';

/**
 * Interface for crypto operations that can be run in a Web Worker
 */
export interface CryptoWorker {
  deriveKEK(
    _password: string,
    _salt: Uint8Array,
    _params?: Argon2Params
  ): Promise<CryptoKey>;
  wrapUMK(_umk: CryptoKey, _kek: CryptoKey): Promise<WrappedKey>;
  unwrapUMK(_wrappedKey: WrappedKey, _kek: CryptoKey): Promise<CryptoKey>;
  hkdf(_key: CryptoKey, _info: string, _length?: number): Promise<CryptoKey>;
  aesGcmEncrypt(
    _key: CryptoKey,
    _plaintext: Uint8Array
  ): Promise<EncryptedData>;
  aesGcmDecrypt(
    _key: CryptoKey,
    _encryptedData: EncryptedData
  ): Promise<Uint8Array>;
  generateUMK(): Promise<CryptoKey>;
  generateSalt(_length?: number): Promise<Uint8Array>;
}

/**
 * Default implementation using main thread crypto APIs
 * In production, this should be replaced with a Web Worker implementation
 */
export class MainThreadCryptoWorker implements CryptoWorker {
  async deriveKEK(
    password: string,
    salt: Uint8Array,
    params?: Argon2Params
  ): Promise<CryptoKey> {
    const { deriveKEK } = await import('./argon2');
    return deriveKEK(password, salt, params);
  }

  async wrapUMK(umk: CryptoKey, kek: CryptoKey): Promise<WrappedKey> {
    const wrappedKey = await crypto.subtle.wrapKey('raw', umk, kek, 'AES-KW');
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const { DEFAULT_ARGON2_PARAMS } = await import('./argon2');

    return {
      wrappedKey: new Uint8Array(wrappedKey),
      salt,
      params: DEFAULT_ARGON2_PARAMS,
    };
  }

  async unwrapUMK(wrappedKey: WrappedKey, kek: CryptoKey): Promise<CryptoKey> {
    const umkRaw = await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey.wrappedKey,
      kek,
      'AES-KW',
      { name: 'HMAC', hash: 'SHA-256' },
      true, // extractable
      ['sign']
    );

    return umkRaw;
  }

  async hkdf(
    key: CryptoKey,
    info: string,
    length?: number
  ): Promise<CryptoKey> {
    const { hkdf } = await import('./hkdf');
    return hkdf(key, info, length);
  }

  async aesGcmEncrypt(
    key: CryptoKey,
    plaintext: Uint8Array
  ): Promise<EncryptedData> {
    const { aesGcmEncrypt } = await import('./aes');
    return aesGcmEncrypt(key, plaintext);
  }

  async aesGcmDecrypt(
    key: CryptoKey,
    encryptedData: EncryptedData
  ): Promise<Uint8Array> {
    const { aesGcmDecrypt } = await import('./aes');
    return aesGcmDecrypt(key, encryptedData);
  }

  async generateUMK(): Promise<CryptoKey> {
    const { generateUMK } = await import('./hkdf');
    return generateUMK();
  }

  async generateSalt(length: number = 32): Promise<Uint8Array> {
    const { generateSalt } = await import('./argon2');
    return generateSalt(length);
  }
}
