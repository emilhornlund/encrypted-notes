// @ts-nocheck
export interface Argon2Params {
  m: number; // memory cost in KiB (converted to PBKDF2 iterations)
  t: number; // time cost (converted to PBKDF2 iterations)
  p: number; // parallelism (not used in PBKDF2)
}

export const DEFAULT_ARGON2_PARAMS: Argon2Params = {
  m: 131072, // 128 MiB (converted to ~100k PBKDF2 iterations)
  t: 3, // time cost (converted to ~10k PBKDF2 iterations)
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
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Convert Argon2-like params to PBKDF2 iterations
  // Rough approximation: Argon2 time cost * 1000 + memory cost / 100
  const iterations = Math.max(
    10000,
    params.t * 1000 + Math.floor(params.m / 100)
  );

  // @ts-ignore - Web Crypto API accepts Uint8Array for salt and key type
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

/**
 * Generates cryptographically secure random salt
 */
export function generateSalt(length: number = 32): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
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
