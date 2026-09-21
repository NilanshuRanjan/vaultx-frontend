export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Newer TypeScript's generic Uint8Array<ArrayBufferLike> type does not
 * directly satisfy the DOM lib's BufferSource type expected by Web
 * Crypto API calls (crypto.subtle.*), even though the actual runtime
 * value is fine. This cast-through-unknown is the standard workaround
 * for this known TS/DOM-lib typing friction - it changes nothing about
 * the actual bytes passed to the crypto engine.
 */
export function toBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}