import { deriveSharedKey } from "./x25519";
import { encrypt, decrypt } from "../symmetric/aesGcm";
import type { EncryptedPayload } from "../symmetric/aesGcm";
import { bytesToBase64, base64ToBytes } from "../utils/encoding";

/**
 * Called on the EXISTING trusted device (Device A) once it has
 * received Device B's public key (out of band, via the server).
 *
 * extractableVaultKey MUST come from deriveExtractableVaultKeyForSync(),
 * not from the primary non-extractable vaultKey used elsewhere in the
 * app - passing the normal vaultKey here would throw, by design.
 */
export async function wrapVaultKeyForNewDevice(
  extractableVaultKey: CryptoKey,
  ownPrivateKey: CryptoKey,
  newDevicePublicKey: CryptoKey
): Promise<EncryptedPayload> {
  const sharedKey = await deriveSharedKey(ownPrivateKey, newDevicePublicKey);

  const rawVaultKeyBytes = await crypto.subtle.exportKey("raw", extractableVaultKey);
  const payload = await encrypt(bytesToBase64(new Uint8Array(rawVaultKeyBytes)), sharedKey);

  return payload;
}

/**
 * Called on the NEW device (Device B) after receiving the wrapped
 * VEK from the server. Unwraps it into a usable, non-extractable
 * CryptoKey - the new device gets the same strict default everyone
 * else has, even though Device A's copy was briefly extractable.
 */
export async function unwrapVaultKeyOnNewDevice(
  wrappedPayload: EncryptedPayload,
  ownPrivateKey: CryptoKey,
  trustedDevicePublicKey: CryptoKey
): Promise<CryptoKey> {
  const sharedKey = await deriveSharedKey(ownPrivateKey, trustedDevicePublicKey);
  const rawVaultKeyBase64 = await decrypt(wrappedPayload, sharedKey);
  const rawVaultKeyBytes = base64ToBytes(rawVaultKeyBase64);

  return crypto.subtle.importKey(
    "raw",
    rawVaultKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
