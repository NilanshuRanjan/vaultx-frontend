import { describe, it, expect } from "vitest";
import { generateX25519KeyPair, exportPublicKeyRaw, importPublicKeyRaw, deriveSharedKey } from "./x25519";

describe("X25519 key exchange", () => {
  it("both sides derive the identical shared key from their own private + the other's public key", async () => {
    const deviceA = await generateX25519KeyPair();
    const deviceB = await generateX25519KeyPair();

    const sharedKeyA = await deriveSharedKey(deviceA.privateKey, deviceB.publicKey);
    const sharedKeyB = await deriveSharedKey(deviceB.privateKey, deviceA.publicKey);

    // Both keys are non-extractable, so compare indirectly: encrypt
    // with one, decrypt with the other, and confirm round-trip works.
    const plaintext = new TextEncoder().encode("shared secret check");
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, sharedKeyA, plaintext);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, sharedKeyB, ciphertext);

    expect(new TextDecoder().decode(decrypted)).toBe("shared secret check");
  });

  it("public key can be exported and re-imported without losing correctness", async () => {
    const deviceA = await generateX25519KeyPair();
    const deviceB = await generateX25519KeyPair();

    const exportedPublicKeyB = await exportPublicKeyRaw(deviceB.publicKey);
    const reimportedPublicKeyB = await importPublicKeyRaw(exportedPublicKeyB);

    const sharedKeyA = await deriveSharedKey(deviceA.privateKey, reimportedPublicKeyB);
    const sharedKeyB = await deriveSharedKey(deviceB.privateKey, deviceA.publicKey);

    const plaintext = new TextEncoder().encode("re-import check");
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, sharedKeyA, plaintext);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, sharedKeyB, ciphertext);

    expect(new TextDecoder().decode(decrypted)).toBe("re-import check");
  });

  it("a third party's key produces a different shared secret (cannot decrypt)", async () => {
    const deviceA = await generateX25519KeyPair();
    const deviceB = await generateX25519KeyPair();
    const attacker = await generateX25519KeyPair();

    const sharedKeyA = await deriveSharedKey(deviceA.privateKey, deviceB.publicKey);
    const sharedKeyAttacker = await deriveSharedKey(attacker.privateKey, deviceB.publicKey);

    const plaintext = new TextEncoder().encode("secret");
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, sharedKeyA, plaintext);

    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, sharedKeyAttacker, ciphertext)
    ).rejects.toThrow();
  });
});
