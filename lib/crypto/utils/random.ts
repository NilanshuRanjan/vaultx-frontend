export function generateSalt(byteLength = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(byteLength));
}
