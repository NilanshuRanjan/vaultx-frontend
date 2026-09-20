import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, login, logout } from "./authService";
import { bytesToHex, bytesToBase64 } from "../lib/crypto/utils/encoding";
import type { Argon2Params } from "../lib/crypto/kdf";

const FAST_ARGON2_PARAMS: Argon2Params = {
  memorySize: 8,
  iterations: 1,
  parallelism: 1,
  hashLength: 32,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("authService.register", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends a derived auth_key and salts, never the master password", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "user-1", email: "test@example.com" })
    );

    const result = await register(
      "test@example.com",
      "correct-horse-battery-staple",
      FAST_ARGON2_PARAMS
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body as string);

    expect(sentBody.email).toBe("test@example.com");
    expect(sentBody.auth_key).toBeTypeOf("string");
    expect(sentBody.argon2_salt).toBeTypeOf("string");
    expect(sentBody.hkdf_salt).toBeTypeOf("string");

    expect(options.body as string).not.toContain("correct-horse-battery-staple");

    expect(result.user.email).toBe("test@example.com");
    expect(result.vaultKey.extractable).toBe(false);
  });

  it("sends credentials: include so the session cookie is set", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "user-1", email: "a@b.com" })
    );
    await register("a@b.com", "password", FAST_ARGON2_PARAMS);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe("include");
  });
});

describe("authService.login", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("fetches salts first, then posts a derived auth_key", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          argon2_salt: bytesToHex(new Uint8Array(16).fill(7)),
          hkdf_salt: bytesToBase64(new Uint8Array(16).fill(9)),
        })
      )
      .mockResolvedValueOnce(jsonResponse({ id: "user-1", email: "a@b.com" }));

    const result = await login("a@b.com", "correct-horse-battery-staple", FAST_ARGON2_PARAMS);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [saltsUrl] = fetchMock.mock.calls[0];
    expect(String(saltsUrl)).toContain("/auth/salts");

    const [, loginOptions] = fetchMock.mock.calls[1];
    const sentBody = JSON.parse(loginOptions.body as string);
    expect(sentBody.auth_key).toBeTypeOf("string");
    expect(loginOptions.body as string).not.toContain("correct-horse-battery-staple");

    expect(result.user.email).toBe("a@b.com");
  });
});

describe("authService.logout", () => {
  it("posts to /auth/logout", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ status: "logged out" }));
    vi.stubGlobal("fetch", fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/auth/logout");
  });
});
