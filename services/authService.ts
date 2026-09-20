import { deriveMasterKey, deriveKeys, DEFAULT_ARGON2_PARAMS } from "../lib/crypto/kdf";
import type { Argon2Params } from "../lib/crypto/kdf";
import { generateSalt } from "../lib/crypto/utils/random";
import { bytesToHex, bytesToBase64, base64ToBytes } from "../lib/crypto/utils/encoding";
import { apiPost, apiGet } from "./api/httpClient";

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResult {
  user: AuthUser;
  vaultKey: CryptoKey;
}

interface SaltsResponse {
  argon2_salt: string;
  hkdf_salt: string;
}

export async function register(
  email: string,
  masterPassword: string,
  argon2Params: Argon2Params = DEFAULT_ARGON2_PARAMS
): Promise<AuthResult> {
  const argon2Salt = generateSalt(16);
  const hkdfSalt = generateSalt(16);

  const masterKey = await deriveMasterKey(
    masterPassword,
    bytesToHex(argon2Salt),
    argon2Params
  );
  const { authKeyBytes, vaultKey } = await deriveKeys(masterKey, hkdfSalt);

  const user = await apiPost<AuthUser>("/auth/register", {
    email,
    auth_key: bytesToBase64(authKeyBytes),
    argon2_salt: bytesToHex(argon2Salt),
    hkdf_salt: bytesToBase64(hkdfSalt),
  });

  return { user, vaultKey };
}

export async function login(
  email: string,
  masterPassword: string,
  argon2Params: Argon2Params = DEFAULT_ARGON2_PARAMS
): Promise<AuthResult> {
  const salts = await apiGet<SaltsResponse>(
    "/auth/salts?email=" + encodeURIComponent(email)
  );

  const masterKey = await deriveMasterKey(
    masterPassword,
    salts.argon2_salt,
    argon2Params
  );
  const hkdfSaltBytes = base64ToBytes(salts.hkdf_salt);
  const { authKeyBytes, vaultKey } = await deriveKeys(masterKey, hkdfSaltBytes);

  const user = await apiPost<AuthUser>("/auth/login", {
    email,
    auth_key: bytesToBase64(authKeyBytes),
  });

  return { user, vaultKey };
}

export async function logout(): Promise<void> {
  await apiPost("/auth/logout", {});
}
