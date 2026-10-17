import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookStream — Webhook CRM Console",
  description:
    "Full-stack webhook integration console: transmit 49-field CRM payloads, smart-upsert them into PostgreSQL, and watch live call analytics with transcripts.",
};

export const viewport: Viewport = {
  themeColor: "#05070f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
