import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "POS — Billing & Business Manager",
  description: "Fast POS, billing, inventory and business intelligence for small Indian food businesses.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
