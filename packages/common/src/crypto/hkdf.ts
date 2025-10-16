/**
 * Derives a key using HKDF-SHA256
 */
export async function hkdf(
  key: CryptoKey,
  info: string,
  length: number = 32
): Promise<CryptoKey> {
  const infoBytes = new TextEncoder().encode(info);

  // First, extract phase (HMAC-SHA256 with zero salt)
  const prk = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey(
      'raw',
      new Uint8Array(32), // zero salt
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    await crypto.subtle.exportKey('raw', key)
  );

  // Expand phase
  const hashLen = 32; // SHA-256 output length
  const n = Math.ceil(length / hashLen);
  const t = new Uint8Array(n * hashLen);
  let tPrev = new Uint8Array(0);

  for (let i = 1; i <= n; i++) {
    const hmacInput = new Uint8Array(tPrev.length + infoBytes.length + 1);
    hmacInput.set(tPrev, 0);
    hmacInput.set(infoBytes, tPrev.length);
    hmacInput[hmacInput.length - 1] = i;

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(prk),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const hmacOutput = await crypto.subtle.sign('HMAC', hmacKey, hmacInput);
    t.set(new Uint8Array(hmacOutput), (i - 1) * hashLen);
    tPrev = new Uint8Array(hmacOutput);
  }

  const derivedKey = t.slice(0, length);

  return await crypto.subtle.importKey(
    'raw',
    derivedKey,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a User Master Key (UMK)
 */
export async function generateUMK(): Promise<CryptoKey> {
  const keyData = crypto.getRandomValues(new Uint8Array(32));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    'HKDF',
    false,
    ['deriveKey']
  );
}