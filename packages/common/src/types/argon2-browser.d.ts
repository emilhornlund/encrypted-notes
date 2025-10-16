declare module 'argon2-browser' {
  export interface Argon2Params {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    time: number;
    mem: number;
    parallelism: number;
    hashLen: number;
    type: number;
  }

  export interface Argon2Result {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  export function hash(params: Argon2Params): Promise<Argon2Result>;
}

// Extend the global types to include our custom Argon2Params
declare global {
  interface Argon2Params {
    m?: number;
    t?: number;
    p?: number;
  }
}