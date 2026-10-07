import type { Metadata } from "next";
import { Noto_Sans_Telugu, Noto_Sans_Devanagari } from "next/font/google";
import "./marketing.css";
import { SITE } from "@/lib/marketing/site";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { JsonLd, organizationLd, websiteLd, softwareLd } from "@/components/marketing/JsonLd";

// Regional fonts only load on the public website pages (not inside the billing app).
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "600", "700"], variable: "--font-telugu-face", display: "swap", preload: false });
const hindi = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "700"], variable: "--font-hindi-face", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Billo – Restaurant Billing App & POS for India | Token Printing, Udhaari, GST",
    template: "%s",
  },
  description: SITE.description,
  applicationName: "Billo",
  keywords: [
    "Billo", "Billo app", "Billo billing", "Billo POS", "Billo restaurant billing",
    "restaurant billing software", "restaurant billing app", "restaurant POS India", "POS software India",
    "billing app for restaurant", "tiffin centre billing app", "hotel billing software", "billing machine for restaurant",
    "Bluetooth thermal printer billing app", "token billing app", "udhaari app", "khata app for restaurant",
    "GST billing software for restaurant", "billing software India", "POS for restaurants India", "hotel billing machine",
  ],
  authors: [{ name: "Billo" }],
  creator: "Billo",
  publisher: "Billo",
  category: "Business software",
  alternates: { canonical: "/", languages: { "en-IN": "/", "hi-IN": "/hi", "te-IN": "/te" } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE.url,
    siteName: "Billo",
    title: "Billo – Fast billing for Indian restaurants",
    description: SITE.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Billo – restaurant billing app for India" }],
  },
  twitter: { card: "summary_large_image", title: "Billo – Fast billing for Indian restaurants", description: SITE.description, images: ["/og-image.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: true, email: true },
  // Google Search Console "HTML tag" verification — set NEXT_PUBLIC_GOOGLE_VERIFICATION in Vercel.
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : undefined,
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mkt ${telugu.variable} ${hindi.variable} flex min-h-screen w-full flex-col`}>
      <JsonLd data={[organizationLd(), websiteLd(), softwareLd()]} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
