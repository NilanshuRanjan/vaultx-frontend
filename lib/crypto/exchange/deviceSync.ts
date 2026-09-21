import { deriveSharedKey } from "./x25519";
import { encrypt, decrypt } from "../symmetric/aesGcm";
import type { EncryptedPayload } from "../symmetric/aesGcm";
import { bytesToBase64, base64ToBytes, toBufferSource } from "../utils/encoding";

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
    toBufferSource(rawVaultKeyBytes),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}