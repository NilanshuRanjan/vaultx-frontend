import { describe, it, expect, vi } from "vitest";
import { createVaultItem, listVaultItems } from "./vaultItems";
import { encrypt } from "../../lib/crypto/symmetric";

async function generateTestVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createVaultItem", () => {
  it("encrypts before sending - plaintext never appears in the request body", async () => {
    const vaultKey = await generateTestVaultKey();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: "item-1",
        ciphertext: "abc",
        nonce: "def",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = {
      title: "GitHub",
      username: "nilanshu",
      password: "super-secret-pw",
      url: "https://github.com",
    };
    await createVaultItem(data, vaultKey);

    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body as string);

    expect(sentBody.ciphertext).toBeTypeOf("string");
    expect(sentBody.nonce).toBeTypeOf("string");
    expect(options.body as string).not.toContain("super-secret-pw");
    expect(options.body as string).not.toContain("GitHub");
  });
});

describe("listVaultItems", () => {
  it("decrypts records back into the original vault item data", async () => {
    const vaultKey = await generateTestVaultKey();
    const data = { title: "Gmail", username: "nilanshu@gmail.com", password: "another-secret" };
    const payload = await encrypt(JSON.stringify(data), vaultKey);

    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse([
        {
          id: "item-1",
          ciphertext: payload.ciphertext,
          nonce: payload.nonce,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    const items = await listVaultItems(vaultKey);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Gmail");
    expect(items[0].password).toBe("another-secret");
    expect(items[0].id).toBe("item-1");
  });

  it("throws if decrypting with the wrong vault key, rather than returning garbage silently", async () => {
    const vaultKey = await generateTestVaultKey();
    const wrongKey = await generateTestVaultKey();
    const payload = await encrypt(
      JSON.stringify({ title: "X", username: "y", password: "z" }),
      wrongKey
    );

    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse([
        {
          id: "item-1",
          ciphertext: payload.ciphertext,
          nonce: payload.nonce,
          created_at: "t",
          updated_at: "t",
        },
      ])
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listVaultItems(vaultKey)).rejects.toThrow();
  });
});
