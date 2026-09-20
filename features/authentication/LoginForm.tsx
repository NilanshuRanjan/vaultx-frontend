"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "./AuthContext";
import { ApiError } from "../../services/api/httpClient";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid email or password" : "Login failed");
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
      </div>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "var(--color-danger)" }} className="vx-fade-in">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="vx-btn-primary">
        {isSubmitting ? "Unlocking..." : "Log In"}
      </button>
    </form>
  );
}