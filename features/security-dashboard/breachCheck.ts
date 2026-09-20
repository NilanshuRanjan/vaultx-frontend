const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";

export interface BreachCheckResult {
  breached: boolean;
  occurrences: number;
}

async function sha1Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Checks a password against the HaveIBeenPwned breach corpus using
 * k-anonymity: only the first 5 hex characters of the SHA-1 hash are
 * sent to the API. HIBP returns all suffixes matching that prefix,
 * and the match is found locally - the full password and full hash
 * never leave the browser.
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(HIBP_RANGE_URL + prefix);
  if (!res.ok) {
    throw new Error("Breach check request failed with status " + res.status);
  }

  const text = await res.text();
  const lines = text.split("\r\n");

  for (const line of lines) {
    const [lineSuffix, countStr] = line.split(":");
    if (lineSuffix === suffix) {
      return { breached: true, occurrences: parseInt(countStr, 10) };
    }
  }

  return { breached: false, occurrences: 0 };
}
