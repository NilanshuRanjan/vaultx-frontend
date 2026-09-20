import { describe, it, expect } from "vitest";
import { analyzePasswordStrength } from "./passwordStrength";

describe("analyzePasswordStrength", () => {
  it("scores a common weak password as low", () => {
    const result = analyzePasswordStrength("password123");
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toMatch(/Weak/);
  });

  it("scores a long random passphrase as high", () => {
    const result = analyzePasswordStrength("correct-horse-battery-staple-99xz");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("includes feedback for weak passwords", () => {
    const result = analyzePasswordStrength("qwerty");
    expect(result.feedback.length).toBeGreaterThan(0);
  });
});
