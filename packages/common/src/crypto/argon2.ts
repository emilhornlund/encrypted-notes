// @ts-nocheck
import { hash } from 'argon2-browser';

export interface Argon2Params {
  m: number; // memory cost in KiB
  t: number; // time cost
  p: number; // parallelism
}

export const DEFAULT_ARGON2_PARAMS: Argon2Params = {
  m: 131072, // 128 MiB
  t: 3,
  p: 1,
};

/**
 * Derives a Key Encryption Key (KEK) from password and salt using Argon2id
 */
export async function deriveKEK(
  password: string,
  salt: Uint8Array,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS
): Promise<CryptoKey> {
  const passwordBytes = new TextEncoder().encode(password);

  const result = await hash({
    pass: passwordBytes,
    salt,
    time: params.t,
    mem: params.m, // already in KiB
    parallelism: params.p,
    hashLen: 32,
    type: 2, // Argon2id
  });

  // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
  return await crypto.subtle.importKey(
    'raw',
    result.hash,
    'AES-KW',
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