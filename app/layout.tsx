import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPro",
  description: "Gestion de cabinet pour kinésithérapeutes",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
