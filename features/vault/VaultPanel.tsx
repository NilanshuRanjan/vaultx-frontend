"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../authentication";
import {
  createVaultItem,
  listVaultItems,
  updateVaultItem,
  deleteVaultItem,
} from "./vaultItems";
import type { VaultItemData, DecryptedVaultItem } from "./vaultItems";
import { AddItemForm } from "./AddItemForm";
import { VaultItemRow } from "./VaultItemRow";

export function VaultPanel() {
  const { vaultKey } = useAuth();
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultKey) return;
    let cancelled = false;

    setIsLoading(true);
    listVaultItems(vaultKey)
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load vault items");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vaultKey]);

  async function handleAdd(data: VaultItemData) {
    if (!vaultKey) return;
    const newItem = await createVaultItem(data, vaultKey);
    setItems((prev) => [...prev, newItem]);
  }

  async function handleUpdate(id: string, data: VaultItemData) {
    if (!vaultKey) return;
    const updated = await updateVaultItem(id, data, vaultKey);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  async function handleDelete(id: string) {
    await deleteVaultItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (!vaultKey) {
    return <p className="text-sm text-gray-500">Vault is locked.</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-bold">Vault</h2>

      <AddItemForm onAdd={handleAdd} />

      {isLoading && <p className="text-sm text-gray-500">Loading vault items...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-gray-500">No items yet. Add one above.</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <VaultItemRow
            key={item.id}
            item={item}
            onUpdate={(data) => handleUpdate(item.id, data)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>
    </div>
  );
}