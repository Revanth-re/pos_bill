import { SITE, PLANS, KIT, FAQS } from "@/lib/marketing/site";

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}/#org`,
  name: "Billo",
  alternateName: ["Billo App", "Billo Billing", "Billo POS", "Billo Restaurant Billing"],
  url: SITE.url,
  logo: `${SITE.url}/brand/billo-icon.png`,
  email: SITE.email,
  telephone: SITE.phone,
  areaServed: { "@type": "Country", name: "India" },
  contactPoint: [{ "@type": "ContactPoint", telephone: SITE.phone, email: SITE.email, contactType: "sales", areaServed: "IN", availableLanguage: ["English", "Hindi", "Telugu"] }],
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: "Billo",
  url: SITE.url,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE.url}/#org` },
});

export const softwareLd = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE.url}/#app`,
  name: "Billo",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Restaurant POS / Billing",
  operatingSystem: "Android, Windows, macOS, ChromeOS (web app)",
  description: SITE.description,
  url: SITE.url,
  image: `${SITE.url}/og-image.png`,
  publisher: { "@id": `${SITE.url}/#org` },
  offers: [
    ...PLANS.map((p) => ({ "@type": "Offer", name: `Billo ${p.name} (${p.period})`, price: p.price, priceCurrency: "INR", url: `${SITE.url}/pricing`, availability: "https://schema.org/InStock" })),
    { "@type": "Offer", name: KIT.name, price: KIT.price, priceCurrency: "INR", url: `${SITE.url}/pricing`, availability: "https://schema.org/InStock" },
  ],
  featureList: ["Token printing", "Bluetooth thermal printer", "Udhaari / credit khata", "Tiffin subscriptions", "GST bills", "Staff roles", "Cashier shifts", "Daily sales reports"],
});

export const faqLd = (faqs: readonly { q: string; a: string }[] = FAQS) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.path}` })),
});
