"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth, LoginForm, RegisterForm } from "../features/authentication";
import { PasswordGeneratorPanel } from "../features/password-generator";
import { VaultPanel } from "../features/vault";
import { SecurityCheckPanel } from "../features/security-dashboard";
import { DashboardShell } from "../components/DashboardShell";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  if (isAuthenticated) {
    return (
      <DashboardShell
        vaultContent={<VaultPanel />}
        generatorContent={<PasswordGeneratorPanel />}
        securityContent={<SecurityCheckPanel />}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div className="vx-card vx-fade-in" style={{ width: "100%", maxWidth: "26rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <Lock size={22} />
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>VaultX</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
              Zero-knowledge password manager
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)" }}>
          <button
            onClick={() => setMode("login")}
            className={"vx-tab " + (mode === "login" ? "vx-tab-active" : "")}
          >
            Log In
          </button>
          <button
            onClick={() => setMode("register")}
            className={"vx-tab " + (mode === "register" ? "vx-tab-active" : "")}
          >
            Register
          </button>
        </div>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}
