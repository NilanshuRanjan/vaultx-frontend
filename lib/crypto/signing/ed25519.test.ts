import { describe, it, expect } from "vitest";
import { generateDeviceIdentity, signMessage, verifySignature } from "./ed25519";

describe("Ed25519 device signing", () => {
  it("a signature from the device verifies successfully with its own public key", async () => {
    const device = await generateDeviceIdentity();
    const message = "sync-request:device-b:2026-09-16T00:00:00Z";

    const signature = await signMessage(message, device.privateKey);
    const isValid = await verifySignature(message, signature, device.publicKey);

    expect(isValid).toBe(true);
  });

  it("a signature does not verify against a different device's public key", async () => {
    const deviceA = await generateDeviceIdentity();
    const deviceB = await generateDeviceIdentity();
    const message = "sync-request:device-x";

    const signature = await signMessage(message, deviceA.privateKey);
    const isValid = await verifySignature(message, signature, deviceB.publicKey);

    expect(isValid).toBe(false);
  });

  it("a tampered message fails verification even with the correct public key", async () => {
    const device = await generateDeviceIdentity();
    const originalMessage = "approve-device:xyz";
    const signature = await signMessage(originalMessage, device.privateKey);

    const isValid = await verifySignature("approve-device:ATTACKER", signature, device.publicKey);

    expect(isValid).toBe(false);
  });
});
