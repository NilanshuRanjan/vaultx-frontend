import { encrypt, decrypt } from "../../lib/crypto/symmetric";
import {
  createVaultItemRecord,
  listVaultItemRecords,
  updateVaultItemRecord,
  deleteVaultItemRecord,
} from "../../services/vaultService";

export interface VaultItemData {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface DecryptedVaultItem extends VaultItemData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export async function createVaultItem(
  data: VaultItemData,
  vaultKey: CryptoKey
): Promise<DecryptedVaultItem> {
  const payload = await encrypt(JSON.stringify(data), vaultKey);
  const record = await createVaultItemRecord(payload);
  return { ...data, id: record.id, createdAt: record.created_at, updatedAt: record.updated_at };
}

export async function listVaultItems(vaultKey: CryptoKey): Promise<DecryptedVaultItem[]> {
  const records = await listVaultItemRecords();
  const items: DecryptedVaultItem[] = [];

  for (const record of records) {
    const plaintext = await decrypt(
      { nonce: record.nonce, ciphertext: record.ciphertext },
      vaultKey
    );
    const data = JSON.parse(plaintext) as VaultItemData;
    items.push({ ...data, id: record.id, createdAt: record.created_at, updatedAt: record.updated_at });
  }

  return items;
}

export async function updateVaultItem(
  id: string,
  data: VaultItemData,
  vaultKey: CryptoKey
): Promise<DecryptedVaultItem> {
  const payload = await encrypt(JSON.stringify(data), vaultKey);
  const record = await updateVaultItemRecord(id, payload);
  return { ...data, id: record.id, createdAt: record.created_at, updatedAt: record.updated_at };
}

export async function deleteVaultItem(id: string): Promise<void> {
  await deleteVaultItemRecord(id);
}
