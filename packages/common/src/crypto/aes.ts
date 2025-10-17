import { EncryptedData } from './types';
/**
 * Encrypts data using AES-GCM with a random IV
 */
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  );

  return {
    ciphertext,
    iv,
  };
}

/**
 * Decrypts data using AES-GCM
 */
export async function aesGcmDecrypt(
  key: CryptoKey,
  encryptedData: EncryptedData
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: encryptedData.iv,
    },
    key,
    encryptedData.ciphertext
  );

  return new Uint8Array(plaintext);
}

/**
 * Generates a new AES-GCM key for content encryption
 */
export async function generateContentKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}
