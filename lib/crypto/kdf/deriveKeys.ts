import { toBufferSource } from "../utils/encoding";

const AK_INFO = new TextEncoder().encode("vaultx-authentication-key-v1");
const VEK_INFO = new TextEncoder().encode("vaultx-vault-encryption-key-v1");

export interface DerivedKeys {
  authKeyBytes: Uint8Array;
  vaultKey: CryptoKey;
}

async function importBaseKey(masterKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toBufferSource(masterKey), "HKDF", false, ["deriveBits", "deriveKey"]);
}

export async function deriveKeys(
  masterKey: Uint8Array,
  hkdfSalt: Uint8Array
): Promise<DerivedKeys> {
  const baseKey = await importBaseKey(masterKey);

  const akBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: toBufferSource(hkdfSalt), info: toBufferSource(AK_INFO) },
    baseKey,
    256
  );

  const vaultKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: toBufferSource(hkdfSalt), info: toBufferSource(VEK_INFO) },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { authKeyBytes: new Uint8Array(akBits), vaultKey };
}

export async function deriveExtractableVaultKeyForSync(
  masterKey: Uint8Array,
  hkdfSalt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await importBaseKey(masterKey);

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: toBufferSource(hkdfSalt), info: toBufferSource(VEK_INFO) },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}