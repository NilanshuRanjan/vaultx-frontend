import { toBufferSource } from "../utils/encoding";

export interface Ed25519KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export async function generateDeviceIdentity(): Promise<Ed25519KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );
  return keyPair as Ed25519KeyPair;
}

export async function signMessage(message: string, privateKey: CryptoKey): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign("Ed25519", privateKey, toBufferSource(encoded));
  return new Uint8Array(signature);
}

export async function verifySignature(
  message: string,
  signature: Uint8Array,
  publicKey: CryptoKey
): Promise<boolean> {
  const encoded = new TextEncoder().encode(message);
  return crypto.subtle.verify(
    "Ed25519",
    publicKey,
    toBufferSource(signature),
    toBufferSource(encoded)
  );
}