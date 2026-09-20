"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { register as registerService, login as loginService, logout as logoutService } from "../../services/authService";
import type { AuthUser } from "../../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  vaultKey: CryptoKey | null;
  isAuthenticated: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);

  async function register(email: string, password: string) {
    const result = await registerService(email, password);
    setUser(result.user);
    setVaultKey(result.vaultKey);
  }

  async function login(email: string, password: string) {
    const result = await loginService(email, password);
    setUser(result.user);
    setVaultKey(result.vaultKey);
  }

  async function logout() {
    await logoutService();
    setUser(null);
    setVaultKey(null);
  }

  const value: AuthContextValue = {
    user,
    vaultKey,
    isAuthenticated: user !== null && vaultKey !== null,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
