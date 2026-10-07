import Link from "next/link";
import { SITE, USE_CASES, CITIES, whatsapp } from "@/lib/marketing/site";

export function Footer() {
  return (
    <footer className="bg-brand-deep text-white/80">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <img src="/brand/billo-icon.png" alt="" width={30} height={30} className="h-7 w-7 object-contain" />
            </span>
            <img src="/brand/billo-wordmark-light.png" alt="Billo" width={84} height={28} className="h-7 w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Fast billing, token printing and udhaari khata for restaurants, tiffin centres and cafés. Made in India, for food businesses everywhere.
          </p>
          <div className="mt-5 space-y-1.5 text-sm">
            <a href={`tel:+${SITE.phoneRaw}`} className="block hover:text-accent">📞 {SITE.phone}</a>
            <a href={whatsapp()} target="_blank" rel="noopener" className="block hover:text-accent">💬 WhatsApp us</a>
            <a href={`mailto:${SITE.email}`} className="block break-all hover:text-accent">✉️ {SITE.email}</a>
          </div>
        </div>
        <FooterCol title="Billo">
          <FL href="/features">Features</FL>
          <FL href="/pricing">Pricing</FL>
          <FL href="/hi">Billo हिन्दी में</FL>
          <FL href="/te">Billo తెలుగులో</FL>
          <FL href="/contact">Contact & demo</FL>
          <FL href={SITE.loginUrl}>Login to Billo</FL>
        </FooterCol>
        <FooterCol title="Billo for">
          {USE_CASES.map((u) => (
            <FL key={u.slug} href={`/for/${u.slug}`}>{u.name}</FL>
          ))}
        </FooterCol>
        <FooterCol title="Billing software in">
          {CITIES.slice(0, 10).map((c) => (
            <FL key={c.slug} href={`/billing-software/${c.slug}`}>{c.name}</FL>
          ))}
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Billo · Restaurant billing app for India</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/terms" className="hover:text-accent">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-white">{title}</p>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}
function FL({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-accent">{children}</Link>
    </li>
  );
}
