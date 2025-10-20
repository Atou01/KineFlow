import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSentry } from "@/lib/monitoring/sentry";

// Initialize Sentry
if (typeof window !== "undefined") {
  initSentry();
}

export const metadata: Metadata = {
  title: "FlowPro",
  description: "Gestion de cabinet pour kinésithérapeutes",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
