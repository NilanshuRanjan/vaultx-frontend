import { apiGet, apiPost, apiPut, apiDelete } from "./api/httpClient";
import type { EncryptedPayload } from "../lib/crypto/symmetric";

export interface VaultItemRecord {
  id: string;
  ciphertext: string;
  nonce: string;
  created_at: string;
  updated_at: string;
}

export async function createVaultItemRecord(payload: EncryptedPayload): Promise<VaultItemRecord> {
  return apiPost<VaultItemRecord>("/vault/items", payload);
}

export async function listVaultItemRecords(): Promise<VaultItemRecord[]> {
  return apiGet<VaultItemRecord[]>("/vault/items");
}

export async function updateVaultItemRecord(id: string, payload: EncryptedPayload): Promise<VaultItemRecord> {
  return apiPut<VaultItemRecord>("/vault/items/" + id, payload);
}

export async function deleteVaultItemRecord(id: string): Promise<void> {
  await apiDelete("/vault/items/" + id);
}
