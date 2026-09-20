import { describe, it, expect, vi } from "vitest";
import { checkPasswordBreach } from "./breachCheck";

// Real SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
// prefix (sent to API) = 5BAA6
// suffix (matched locally) = 1E4C9B93F3F0682250B6CF8331B7EE68FD8
const FULL_HASH = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";
const PREFIX = "5BAA6";
const SUFFIX = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";

describe("checkPasswordBreach", () => {
  it("sends only the 5-character hash prefix to the API, never the full hash or password", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(SUFFIX + ":3\r\nOTHERSUFFIX1234567890ABCDEFGHIJKLMN:1", { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await checkPasswordBreach("password");

    const [calledUrl] = fetchMock.mock.calls[0];
    const urlString = String(calledUrl);

    expect(urlString).toContain("api.pwnedpasswords.com/range/" + PREFIX);

    const sentSuffix = urlString.split("/range/")[1];
    expect(sentSuffix.length).toBe(5);
    expect(sentSuffix).not.toBe(FULL_HASH);
  });

  it("detects a breach when the suffix matches a returned line", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(SUFFIX + ":3730471\r\nOTHERSUFFIX1234567890ABCDEFGHIJKLMN:5", {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkPasswordBreach("password");

    expect(result.breached).toBe(true);
    expect(result.occurrences).toBe(3730471);
  });

  it("reports no breach when no suffix matches", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response("SOMEUNRELATEDSUFFIX1234567890ABCDEFGH:2", { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkPasswordBreach("some-unique-passphrase-xyz");

    expect(result.breached).toBe(false);
    expect(result.occurrences).toBe(0);
  });

  it("throws on a failed request rather than silently reporting safe", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkPasswordBreach("anything")).rejects.toThrow();
  });
});
