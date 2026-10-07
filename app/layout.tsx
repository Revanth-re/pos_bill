import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Billo — Restaurant Billing",
  description: "Fast billing, bills, staff, cash and reports for Indian restaurants.",
  applicationName: "Billo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Billo",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#075E63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* External boot script — more reliable than inline with App Router */}
        <script src="/pwa-boot.js" />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
