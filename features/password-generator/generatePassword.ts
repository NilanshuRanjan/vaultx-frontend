export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: false,
};

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/",
};

const AMBIGUOUS_CHARS = new Set(["0", "O", "1", "l", "I"]);

function buildCharset(options: PasswordOptions): string {
  let charset = "";
  if (options.includeUppercase) charset += CHARSETS.uppercase;
  if (options.includeLowercase) charset += CHARSETS.lowercase;
  if (options.includeNumbers) charset += CHARSETS.numbers;
  if (options.includeSymbols) charset += CHARSETS.symbols;

  if (options.excludeAmbiguous) {
    charset = Array.from(charset)
      .filter((c) => !AMBIGUOUS_CHARS.has(c))
      .join("");
  }

  return charset;
}

/**
 * Returns a random index in [0, max) using rejection sampling over
 * a CSPRNG byte stream — avoids the modulo bias that
 * `randomByte % max` introduces when 256 % max !== 0.
 */
function unbiasedRandomIndex(max: number): number {
  if (max <= 0 || max > 256) {
    throw new Error("unbiasedRandomIndex supports max in (0, 256]");
  }
  const rejectionThreshold = 256 - (256 % max);
  const buffer = new Uint8Array(1);

  let randomByte: number;
  do {
    crypto.getRandomValues(buffer);
    randomByte = buffer[0];
  } while (randomByte >= rejectionThreshold);

  return randomByte % max;
}

export function generatePassword(
  options: PasswordOptions = DEFAULT_PASSWORD_OPTIONS
): string {
  if (options.length < 1) {
    throw new Error("Password length must be at least 1");
  }

  const charset = buildCharset(options);
  if (charset.length === 0) {
    throw new Error("At least one character set must be selected");
  }

  let password = "";
  for (let i = 0; i < options.length; i++) {
    const index = unbiasedRandomIndex(charset.length);
    password += charset[index];
  }

  return password;
}

/** Exposed for the UI to compute the charset size shown to the user. */
export function getCharsetSize(options: PasswordOptions): number {
  return buildCharset(options).length;
}
