const AK_INFO = new TextEncoder().encode("vaultx-authentication-key-v1");
const VEK_INFO = new TextEncoder().encode("vaultx-vault-encryption-key-v1");

export interface DerivedKeys {
  authKeyBytes: Uint8Array;
  vaultKey: CryptoKey;
}

async function importBaseKey(masterKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", masterKey, "HKDF", false, ["deriveBits", "deriveKey"]);
}

export async function deriveKeys(
  masterKey: Uint8Array,
  hkdfSalt: Uint8Array
): Promise<DerivedKeys> {
  const baseKey = await importBaseKey(masterKey);

  const akBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info: AK_INFO },
    baseKey,
    256
  );

  const vaultKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info: VEK_INFO },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { authKeyBytes: new Uint8Array(akBits), vaultKey };
}

/**
 * Re-derives the SAME vault encryption key as deriveKeys(), but as an
 * EXTRACTABLE CryptoKey. This is a deliberate, narrow exception to the
 * non-extractable-by-default rule, used ONLY during the "add a new
 * device" sync flow - see lib/crypto/exchange/deviceSync.ts.
 *
 * Given identical masterKey + hkdfSalt, this produces bit-for-bit the
 * same key as the primary vaultKey from deriveKeys() - it is not a
 * separate key, just an extractable view of it, computed on demand
 * rather than kept around.
 *
 * Callers must discard the exported raw bytes immediately after use
 * (see wrapVaultKeyForNewDevice) and must never persist, log, or
 * store this key anywhere.
 */
export async function deriveExtractableVaultKeyForSync(
  masterKey: Uint8Array,
  hkdfSalt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await importBaseKey(masterKey);

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info: VEK_INFO },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true, // extractable - see doc comment above for why this is safe/scoped
    ["encrypt", "decrypt"]
  );
}
