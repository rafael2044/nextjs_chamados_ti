// Em: app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner"; // 1. Importe o Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chamados TI",
  description: "Gerado por create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster /> {/* 2. Adicione o Toaster aqui (geralmente no final) */}
        </AuthProvider>
      </body>
    </html>
  );
}