import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./aesGcm";
import { hexToBytes, bytesToHex, base64ToBytes } from "../utils/encoding";

async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

describe("AES-256-GCM round trip", () => {
  it("decrypts back to the original plaintext", async () => {
    const key = await generateVaultKey();
    const plaintext = "correct-horse-battery-staple vault secret";

    const payload = await encrypt(plaintext, key);
    const decrypted = await decrypt(payload, key);

    expect(decrypted).toBe(plaintext);
  });

  it("produces a different nonce and ciphertext on every call, even for the same plaintext", async () => {
    const key = await generateVaultKey();
    const plaintext = "same plaintext";

    const a = await encrypt(plaintext, key);
    const b = await encrypt(plaintext, key);

    expect(a.nonce).not.toBe(b.nonce);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("throws when decrypting with the wrong key (auth tag fails)", async () => {
    const key = await generateVaultKey();
    const wrongKey = await generateVaultKey();
    const payload = await encrypt("secret", key);

    await expect(decrypt(payload, wrongKey)).rejects.toThrow();
  });

  it("throws when ciphertext is tampered with (auth tag fails)", async () => {
    const key = await generateVaultKey();
    const payload = await encrypt("secret", key);

    const tamperedBytes = base64ToBytes(payload.ciphertext);
    tamperedBytes[0] ^= 0xff; // flip a bit
    const tampered = {
      ...payload,
      ciphertext: Buffer.from(tamperedBytes).toString("base64"),
    };

    await expect(decrypt(tampered, key)).rejects.toThrow();
  });
});

describe("AES-256-GCM known-answer test (NIST vector)", () => {
  it("matches a published NIST test vector, independent of our KDF", async () => {
    // NIST SP 800-38D / CAVP GCM test vector (256-bit key, 96-bit IV, no AAD)
    const keyHex =
          "b52c505a37d78eda5dd34f20c22540ea1b58963cf8e5bf8ffa85f9f2492505b4";
    const ivHex = "516c33929df5a3284ff463d7";
    const plaintextHex = ""; // this vector uses an empty plaintext
    const expectedCiphertextHex = ""; // empty plaintext -> empty ciphertext
    const expectedTagHex = "bdc1ac884d332457a1d2664f168c76f0";

    const rawKey = hexToBytes(keyHex);
    const key = await crypto.subtle.importKey(
      "raw",
      rawKey,
      "AES-GCM",
      false,
      ["encrypt"]
    );

    const iv = hexToBytes(ivHex);
    const plaintext = hexToBytes(plaintextHex);

    const resultBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintext
    );
    const resultHex = bytesToHex(new Uint8Array(resultBuffer));

    // Web Crypto's output is ciphertext || tag concatenated
    expect(resultHex).toBe(expectedCiphertextHex + expectedTagHex);
  });
});
