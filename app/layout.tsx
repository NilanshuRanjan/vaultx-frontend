import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../features/authentication";
import { ToastProvider } from "../components/Toast";

export const metadata: Metadata = {
  title: "VaultX - Zero-Knowledge Password Manager",
  description: "A zero-knowledge password manager with client-side encryption.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}