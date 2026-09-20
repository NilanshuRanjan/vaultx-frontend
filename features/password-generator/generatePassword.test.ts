import { describe, it, expect, vi } from "vitest";
import { generatePassword, getCharsetSize } from "./generatePassword";
import { calculateEntropyBits, entropyToLabel } from "./entropy";

describe("generatePassword", () => {
  it("produces a password of the requested length", () => {
    const pw = generatePassword({
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    expect(pw.length).toBe(24);
  });

  it("only uses characters from the selected sets (numbers only)", () => {
    const pw = generatePassword({
      length: 50,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: false,
    });
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it("throws if no character set is selected", () => {
    expect(() =>
      generatePassword({
        length: 10,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
      })
    ).toThrow();
  });

  it("excludes ambiguous characters when requested", () => {
    const pw = generatePassword({
      length: 200,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: true,
    });
    expect(pw).not.toMatch(/[0O1lI]/);
  });

  it("uses the CSPRNG (crypto.getRandomValues), not Math.random", () => {
    const spy = vi.spyOn(crypto, "getRandomValues");
    generatePassword({
      length: 10,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("produces different output across calls (sanity check, not a randomness proof)", () => {
    const options = {
      length: 32,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    };
    const a = generatePassword(options);
    const b = generatePassword(options);
    expect(a).not.toBe(b);
  });
});

describe("entropy", () => {
  it("calculates higher entropy for longer passwords with the same charset", () => {
    const base = {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: false,
    };
    const short = calculateEntropyBits({ ...base, length: 8 });
    const long = calculateEntropyBits({ ...base, length: 20 });
    expect(long).toBeGreaterThan(short);
  });

  it("calculates higher entropy for a larger charset at the same length", () => {
    const smallCharset = calculateEntropyBits({
      length: 16,
      includeUppercase: false,
      includeLowercase: true,
      includeNumbers: false,
      includeSymbols: false,
      excludeAmbiguous: false,
    });
    const largeCharset = calculateEntropyBits({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    expect(largeCharset).toBeGreaterThan(smallCharset);
  });

  it("labels entropy bands correctly", () => {
    expect(entropyToLabel(20)).toBe("Weak");
    expect(entropyToLabel(50)).toBe("Fair");
    expect(entropyToLabel(70)).toBe("Strong");
    expect(entropyToLabel(100)).toBe("Very Strong");
  });
});

describe("getCharsetSize", () => {
  it("matches the expected size for a known configuration", () => {
    const size = getCharsetSize({
      length: 1,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: false,
    });
    expect(size).toBe(10); // digits 0-9
  });
});
