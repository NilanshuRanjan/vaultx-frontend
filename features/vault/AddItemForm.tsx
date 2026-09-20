"use client";

import { useState, FormEvent } from "react";
import type { VaultItemData } from "./vaultItems";
import { StrengthMeter } from "../security-dashboard";

export function AddItemForm({ onAdd }: { onAdd: (data: VaultItemData) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onAdd({
        title,
        username,
        password,
        url: url || undefined,
        notes: notes || undefined,
      });
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
      setIsOpen(false);
    } catch {
      setError("Failed to save vault item");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="border rounded px-4 py-2 self-start">
        + Add item
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border rounded p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 font-mono"
        />
        <StrengthMeter password={password} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL (optional)</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isSubmitting ? "Encrypting..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="border rounded px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}