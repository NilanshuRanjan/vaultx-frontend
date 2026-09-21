import { toBufferSource } from "../utils/encoding";

export interface X25519KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export async function generateX25519KeyPair(): Promise<X25519KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "X25519" },
    true,
    ["deriveKey", "deriveBits"]
  );
  return keyPair as X25519KeyPair;
}

export async function exportPublicKeyRaw(publicKey: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey("raw", publicKey);
  return new Uint8Array(raw);
}

export async function importPublicKeyRaw(rawBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toBufferSource(rawBytes),
    { name: "X25519" },
    true,
    []
  );
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "X25519", public: peerPublicKey },
    privateKey,
    256
  );

  const baseKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const info = new TextEncoder().encode("vaultx-device-sync-shared-key-v1");
  const salt = new Uint8Array(16);

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: toBufferSource(salt), info: toBufferSource(info) },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}