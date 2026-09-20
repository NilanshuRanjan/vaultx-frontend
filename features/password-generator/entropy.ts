import { getCharsetSize, type PasswordOptions } from "./generatePassword";

/**
 * Shannon entropy in bits for a password drawn uniformly at random
 * from a charset of the given size: length * log2(charsetSize).
 */
export function calculateEntropyBits(options: PasswordOptions): number {
  const charsetSize = getCharsetSize(options);
  if (charsetSize <= 1) return 0;
  return options.length * Math.log2(charsetSize);
}

export type StrengthLabel = "Weak" | "Fair" | "Strong" | "Very Strong";

export function entropyToLabel(bits: number): StrengthLabel {
  if (bits < 40) return "Weak";
  if (bits < 60) return "Fair";
  if (bits < 80) return "Strong";
  return "Very Strong";
}
