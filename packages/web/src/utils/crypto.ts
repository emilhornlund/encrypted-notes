// Browser-compatible crypto utilities for the web app
// These are client-side implementations that work with Web Crypto API

export interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

export interface WrappedKey {
  wrappedKey: Uint8Array;
  salt: Uint8Array;
  params: Argon2Params;
}

export interface Argon2Params {
  m: number; // memory cost in KiB
  t: number; // time cost
  p: number; // parallelism
}

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

const DEFAULT_ARGON2_PARAMS: Argon2Params = {
  m: 131072, // 128 MiB
  t: 3,
  p: 1,
};

/**
 * Derives a Key Encryption Key (KEK) from password and salt using PBKDF2
 * Note: Using PBKDF2 instead of Argon2 for better browser compatibility
 */
export async function deriveKEK(
  password: string,
  salt: Uint8Array,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS
): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password);

  // Use PBKDF2 for browser compatibility (Argon2 would require WebAssembly)
  const keyMaterial = await (crypto.subtle as any).importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return (crypto.subtle as any).deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: params.t * 1000, // Convert to PBKDF2 iterations
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    true,
    ['unwrapKey']
  ) as any;
}

/**
 * Generates cryptographically secure random salt
 */
export function generateSalt(length: number = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generates a User Master Key (UMK)
 */
export async function generateUMK(): Promise<CryptoKey> {
  const keyData = crypto.getRandomValues(new Uint8Array(32));
  return crypto.subtle.importKey('raw', keyData, 'HKDF', false, ['deriveKey']);
}

/**
 * Derives a key using HKDF-SHA256
 */
export async function hkdf(key: CryptoKey, info: string): Promise<CryptoKey> {
  const infoBytes = new TextEncoder().encode(info);

  return (crypto.subtle as any).deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new ArrayBuffer(32), // zero salt
      info: infoBytes,
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM with a random IV
 */
export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const ciphertext = await (crypto.subtle as any).encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
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
  const plaintext = await (crypto.subtle as any).decrypt(
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
 * Wraps a key using AES-KW
 */
export async function wrapKey(
  key: CryptoKey,
  wrappingKey: CryptoKey
): Promise<Uint8Array> {
  const wrappedKey = await crypto.subtle.wrapKey(
    'raw',
    key,
    wrappingKey,
    'AES-KW'
  );
  return new Uint8Array(wrappedKey);
}

/**
 * Unwraps a key using AES-KW
 */
export async function unwrapKey(
  wrappedKey: Uint8Array,
  unwrappingKey: CryptoKey,
  keyType: KeyType,
  extractable: boolean,
  keyUsages: KeyUsage[]
): Promise<CryptoKey> {
  return (crypto.subtle as any).unwrapKey(
    'raw',
    wrappedKey,
    unwrappingKey,
    'AES-KW',
    keyType,
    extractable,
    keyUsages
  );
}

/**
 * Zeroizes sensitive data from memory
 */
export function zeroize(array: Uint8Array | ArrayBuffer): void {
  if (array instanceof Uint8Array) {
    array.fill(0);
  } else if (array instanceof ArrayBuffer) {
    new Uint8Array(array).fill(0);
  }
}

/**
 * Generates HMAC-SHA256 hash for search indexing
 */
export async function hmacSha256(
  key: CryptoKey,
  data: Uint8Array
): Promise<Uint8Array> {
  const signature = await (crypto.subtle as any).sign('HMAC', key, data);
  return new Uint8Array(signature);
}
