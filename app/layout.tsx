import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/Toaster";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// Optional, set in Vercel → Environment Variables:
//   NEXT_PUBLIC_GA_ID                     → Google Analytics 4 (e.g. G-XXXXXXX)
//   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  → Google Search Console "HTML tag" code
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_VERIFY = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

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
  ...(GOOGLE_VERIFY ? { verification: { google: GOOGLE_VERIFY } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#075E63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Catches Chrome's install popup before React loads (next/script avoids React's <script> warning) */}
        <Script src="/pwa-boot.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster />
        {/* Visitor stats in Vercel → Analytics (no cookies). */}
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
