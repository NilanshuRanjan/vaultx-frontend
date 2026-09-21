import { bytesToBase64, base64ToBytes, toBufferSource } from "../utils/encoding";

const NONCE_LENGTH_BYTES = 12;

export interface EncryptedPayload {
  nonce: string;
  ciphertext: string;
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toBufferSource(nonce) },
    key,
    toBufferSource(encoded)
  );

  return {
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

export async function decrypt(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const nonce = base64ToBytes(payload.nonce);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBufferSource(nonce) },
    key,
    toBufferSource(ciphertext)
  );

  return new TextDecoder().decode(plaintextBuffer);
}