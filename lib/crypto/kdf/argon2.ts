import { argon2id } from "hash-wasm";
import { hexToBytes } from "../utils/encoding";

export interface Argon2Params {
  memorySize: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
}

export const DEFAULT_ARGON2_PARAMS: Argon2Params = {
  memorySize: 65536,
  iterations: 3,
  parallelism: 1,
  hashLength: 32,
};

export async function deriveMasterKey(
  masterPassword: string,
  saltHex: string,
  params: Argon2Params = DEFAULT_ARGON2_PARAMS
): Promise<Uint8Array> {
  const hashHex = await argon2id({
    password: masterPassword,
    salt: saltHex,
    memorySize: params.memorySize,
    iterations: params.iterations,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    outputType: "hex",
  });

  return hexToBytes(hashHex);
}
