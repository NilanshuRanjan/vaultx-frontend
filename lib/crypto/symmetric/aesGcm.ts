import { bytesToBase64, base64ToBytes } from "../utils/encoding";

const NONCE_LENGTH_BYTES = 12; // 96 bits — standard/recommended for AES-GCM

export interface EncryptedPayload {
  nonce: string; // base64
  ciphertext: string; // base64 — includes the auth tag, appended by Web Crypto
}

/**
 * Encrypts plaintext with AES-256-GCM under the given key.
 * Generates a fresh random nonce per call — never pass in a reused nonce.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    encoded
  );

  return {
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypts a payload produced by encrypt(). Throws if the auth tag
 * doesn't verify — i.e. if the ciphertext was tampered with or the
 * wrong key/nonce is used. Never swallow that error silently.
 */
export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const nonce = base64ToBytes(payload.nonce);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}
