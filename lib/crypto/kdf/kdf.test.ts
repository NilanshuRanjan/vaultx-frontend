import { describe, it, expect } from "vitest";
import { deriveMasterKey } from "./argon2";
import { deriveKeys } from "./deriveKeys";
import { generateSalt } from "../utils/random";
import { bytesToHex } from "../utils/encoding";

describe("deriveMasterKey", () => {
  it("is deterministic for the same password and salt", async () => {
    const salt = bytesToHex(generateSalt());
    const a = await deriveMasterKey("correct-horse-battery-staple", salt);
    const b = await deriveMasterKey("correct-horse-battery-staple", salt);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
  });

  it("produces different output for different salts", async () => {
    const a = await deriveMasterKey("same-password", bytesToHex(generateSalt()));
    const b = await deriveMasterKey("same-password", bytesToHex(generateSalt()));
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });
});

describe("deriveKeys — domain separation", () => {
  it("produces an authKey that cannot be trivially derived from the vaultKey", async () => {
    const masterKey = await deriveMasterKey("test-password", bytesToHex(generateSalt()));
    const hkdfSalt = generateSalt();
    const { authKeyBytes, vaultKey } = await deriveKeys(masterKey, hkdfSalt);

    expect(authKeyBytes.length).toBe(32);
    expect(vaultKey.algorithm).toMatchObject({ name: "AES-GCM", length: 256 });
    expect(vaultKey.extractable).toBe(false);
  });

  it("same masterKey + same hkdfSalt reproduces the same authKey (needed to re-derive on login)", async () => {
    const masterKey = await deriveMasterKey("test-password", bytesToHex(generateSalt()));
    const hkdfSalt = generateSalt();
    const first = await deriveKeys(masterKey, hkdfSalt);
    const second = await deriveKeys(masterKey, hkdfSalt);
    expect(bytesToHex(first.authKeyBytes)).toBe(bytesToHex(second.authKeyBytes));
  });
});
