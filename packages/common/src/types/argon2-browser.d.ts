declare module 'argon2-browser' {
  export interface Argon2Params {
    m: number;
    t: number;
    p: number;
  }

  export interface Argon2Result {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  export function argon2(
    _password: Uint8Array,
    _salt: Uint8Array,
    _params: Argon2Params
  ): Promise<Uint8Array>;

  export function hash(_params: Argon2Params): Promise<Argon2Result>;
}
