import type { Metadata, Viewport } from "next";
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

/** Registers SW + captures beforeinstallprompt BEFORE React hydrates.
 * Must stay synchronous in the first paint so Chrome's install event is not missed. */
const EARLY_PWA = `(function(){try{window.__POS_PWA=window.__POS_PWA||{deferred:null};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__POS_PWA.deferred=e;window.dispatchEvent(new Event('pos-pwa-prompt'));});window.addEventListener('appinstalled',function(){window.__POS_PWA.deferred=null;});if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_PWA }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
