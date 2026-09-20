"use client";

import { useState, FormEvent } from "react";
import type { DecryptedVaultItem, VaultItemData } from "./vaultItems";

export function VaultItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: DecryptedVaultItem;
  onUpdate: (data: VaultItemData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState(item.title);
  const [username, setUsername] = useState(item.username);
  const [password, setPassword] = useState(item.password);
  const [url, setUrl] = useState(item.url ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onUpdate({
        title,
        username,
        password,
        url: url || undefined,
        notes: notes || undefined,
      });
      setIsEditing(false);
    } catch {
      setError("Failed to update vault item");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setError("Failed to delete vault item");
      setIsDeleting(false);
    }
  }

  async function handleCopyPassword() {
    await navigator.clipboard.writeText(item.password);
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex flex-col gap-2 border rounded p-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border rounded px-2 py-1"
          placeholder="Title"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="border rounded px-2 py-1"
          placeholder="Username"
        />
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded px-2 py-1 font-mono"
          placeholder="Password"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="URL (optional)"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border rounded px-2 py-1"
          placeholder="Notes (optional)"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="border rounded px-3 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between border rounded p-3">
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-gray-500">{item.username}</p>
        <p className="text-sm font-mono">
          {isRevealed ? item.password : "*".repeat(Math.min(item.password.length, 12))}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2 text-sm">
        <button onClick={() => setIsRevealed((r) => !r)} className="border rounded px-2 py-1">
          {isRevealed ? "Hide" : "Reveal"}
        </button>
        <button onClick={handleCopyPassword} className="border rounded px-2 py-1">
          Copy
        </button>
        <button onClick={() => setIsEditing(true)} className="border rounded px-2 py-1">
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="border rounded px-2 py-1 text-red-600 disabled:opacity-50"
        >
          {isDeleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}