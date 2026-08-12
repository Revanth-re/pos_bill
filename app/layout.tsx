import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "POS — Billing & Business Manager",
  description: "Fast POS, billing, inventory and business intelligence for small Indian food businesses.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const PWA_CAPTURE = `(function(){try{window.__POS_PWA=window.__POS_PWA||{deferred:null};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__POS_PWA.deferred=e;window.dispatchEvent(new Event('pos-pwa-prompt'));});window.addEventListener('appinstalled',function(){window.__POS_PWA.deferred=null;});}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Script id="pwa-prompt-capture" strategy="beforeInteractive">
          {PWA_CAPTURE}
        </Script>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
