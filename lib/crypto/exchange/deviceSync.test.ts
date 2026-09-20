import { describe, it, expect } from "vitest";
import { deriveMasterKey, deriveKeys, deriveExtractableVaultKeyForSync } from "../kdf";
import { generateX25519KeyPair } from "./x25519";
import { wrapVaultKeyForNewDevice, unwrapVaultKeyOnNewDevice } from "./deviceSync";
import { generateSalt } from "../utils/random";
import { bytesToHex } from "../utils/encoding";

const FAST_ARGON2_PARAMS = { memorySize: 8, iterations: 1, parallelism: 1, hashLength: 32 };

describe("device sync end-to-end", () => {
  it("Device B ends up with a vault key that behaves identically to Device A's primary VEK", async () => {
    const argon2Salt = generateSalt(16);
    const hkdfSalt = generateSalt(16);
    const masterKey = await deriveMasterKey("correct-horse-battery-staple", bytesToHex(argon2Salt), FAST_ARGON2_PARAMS);

    // Device A: normal session state - the non-extractable VEK it
    // uses for actual vault encrypt/decrypt day-to-day.
    const { vaultKey: deviceAPrimaryVaultKey } = await deriveKeys(masterKey, hkdfSalt);

    // Device A: the ONE-TIME extractable re-derivation, used only
    // for this sync operation, never stored.
    const extractableVaultKey = await deriveExtractableVaultKeyForSync(masterKey, hkdfSalt);

    const deviceAIdentity = await generateX25519KeyPair();
    const deviceBIdentity = await generateX25519KeyPair();

    const wrapped = await wrapVaultKeyForNewDevice(
      extractableVaultKey,
      deviceAIdentity.privateKey,
      deviceBIdentity.publicKey
    );

    const deviceBVaultKey = await unwrapVaultKeyOnNewDevice(
      wrapped,
      deviceBIdentity.privateKey,
      deviceAIdentity.publicKey
    );

    // Device B's key must be non-extractable, same strict default as everywhere else.
    expect(deviceBVaultKey.extractable).toBe(false);

    // Prove it is the SAME key: something encrypted with Device A's
    // primary VEK must decrypt correctly with Device B's synced key.
    const plaintext = new TextEncoder().encode("vault item synced across devices");
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      deviceAPrimaryVaultKey,
      plaintext
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      deviceBVaultKey,
      ciphertext
    );

    expect(new TextDecoder().decode(decrypted)).toBe("vault item synced across devices");
  });

  it("a device NOT part of the exchange cannot unwrap the VEK", async () => {
    const argon2Salt = generateSalt(16);
    const hkdfSalt = generateSalt(16);
    const masterKey = await deriveMasterKey("some-password", bytesToHex(argon2Salt), FAST_ARGON2_PARAMS);
    const extractableVaultKey = await deriveExtractableVaultKeyForSync(masterKey, hkdfSalt);

    const deviceAIdentity = await generateX25519KeyPair();
    const deviceBIdentity = await generateX25519KeyPair();
    const attackerIdentity = await generateX25519KeyPair();

    const wrapped = await wrapVaultKeyForNewDevice(
      extractableVaultKey,
      deviceAIdentity.privateKey,
      deviceBIdentity.publicKey
    );

    await expect(
      unwrapVaultKeyOnNewDevice(wrapped, attackerIdentity.privateKey, deviceAIdentity.publicKey)
    ).rejects.toThrow();
  });
});
