"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "./AuthContext";
import { ApiError } from "../../services/api/httpClient";

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Master password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label className="vx-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="vx-input"
        />
      </div>
      <div>
        <label className="vx-label">Master Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="vx-input"
        />
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
          This never leaves your browser. If you lose it, your vault cannot be recovered.
        </p>
      </div>
      <div>
        <label className="vx-label">Confirm Master Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="vx-input"
        />
      </div>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "var(--color-danger)" }} className="vx-fade-in">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="vx-btn-primary">
        {isSubmitting ? "Deriving keys..." : "Register"}
      </button>
    </form>
  );
}