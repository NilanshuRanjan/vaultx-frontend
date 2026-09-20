/**
 * X25519 ECDH key exchange for multi-device VEK sharing.
 *
 * Flow: Device A (source of truth) derives a shared secret from its
 * own private key + Device B's public key, uses that to wrap the
 * VEK, and sends only the wrapped VEK over the network. Device B
 * derives the SAME shared secret independently (its private key +
 * Device A's public key) and unwraps it locally. The shared secret
 * itself is never transmitted.
 */

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
    rawBytes,
    { name: "X25519" },
    true,
    []
  );
}

/**
 * Derives a shared AES-256-GCM key from ECDH output, run through
 * HKDF. Never use raw ECDH bytes directly as an encryption key.
 */
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
  const salt = new Uint8Array(16); // zero salt: both sides derive identically, no coordination needed

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
