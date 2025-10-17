export interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

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
  m: number; // memory cost
  t: number; // time cost
  p: number; // parallelism
}

export interface TokenizedText {
  tokens: string[];
  ngrams: string[];
}

export interface SearchHashes {
  termHashes: Uint8Array[];
  ngramHashes: Uint8Array[];
}
