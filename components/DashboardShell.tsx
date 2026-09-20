"use client";

import { useState, ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../features/authentication";

type Tab = "vault" | "generator" | "security";

interface DashboardShellProps {
  vaultContent: ReactNode;
  generatorContent: ReactNode;
  securityContent: ReactNode;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "vault", label: "Vault" },
  { key: "generator", label: "Generator" },
  { key: "security", label: "Security Check" },
];

export function DashboardShell({ vaultContent, generatorContent, securityContent }: DashboardShellProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("vault");

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--color-border)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              background: "var(--gradient-accent)",
              borderRadius: "8px",
              padding: "0.4rem",
              display: "flex",
              color: "#fff",
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <span className="vx-gradient-text" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
            VaultX
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {user?.email}
          </span>
        </div>
        <button
          onClick={() => logout()}
          className="vx-btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <LogOut size={14} />
          Log Out
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0 1.5rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={"vx-tab " + (activeTab === tab.key ? "vx-tab-active" : "")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: "1.5rem", maxWidth: "56rem", margin: "0 auto" }}>
        <div key={activeTab} className="vx-fade-in">
          {activeTab === "vault" && vaultContent}
          {activeTab === "generator" && generatorContent}
          {activeTab === "security" && securityContent}
        </div>
      </main>
    </div>
  );
}