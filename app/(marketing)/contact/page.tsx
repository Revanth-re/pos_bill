import type { Metadata } from "next";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SITE, whatsapp } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Contact Billo – Free Demo for Your Restaurant | WhatsApp 76709 15570",
  description: "Get a free Billo demo for your restaurant, tiffin centre or café. WhatsApp or call +91 76709 15570. Printer shipped and set up anywhere in India.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const cards = [
    { icon: MessageCircle, title: "WhatsApp (fastest)", value: "Chat with us", href: whatsapp(), note: "Usually replies within minutes" },
    { icon: Phone, title: "Call", value: SITE.phone, href: `tel:+${SITE.phoneRaw}`, note: "10 AM – 9 PM, all days" },
    { icon: Mail, title: "Email", value: SITE.email, href: `mailto:${SITE.email}`, note: "For invoices & partnerships" },
  ];
  return (
    <>
      <PageHero crumbs={[{ name: "Contact", href: "/contact" }]} eyebrow="Contact & demo" title="Let's set up Billo at your counter" text="Tell us your shop type and city — we'll show you Billo on a quick call and suggest the right setup. Hindi, English & Telugu." />
      <section className="container-x grid gap-4 py-14 md:grid-cols-3">
        {cards.map((c) => (
          <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="card group p-6 transition-shadow hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft"><c.icon className="h-6 w-6 text-brand" /></span>
            <p className="mt-4 text-sm font-semibold text-muted">{c.title}</p>
            <p className="mt-0.5 break-all text-lg font-bold text-ink group-hover:text-brand">{c.value}</p>
            <p className="mt-1 text-sm text-muted">{c.note}</p>
          </a>
        ))}
      </section>
      <section className="container-x pb-16">
        <div className="card flex items-start gap-4 p-6">
          <MapPin className="h-7 w-7 shrink-0 text-brand" />
          <div>
            <p className="text-lg font-bold">We serve all of India</p>
            <p className="mt-1 text-muted">All over India — from Delhi, Mumbai, Bengaluru, Hyderabad, Chennai and Kolkata to smaller towns. We ship the printer to your shop and set everything up with you on a video call, usually the same day. On-site setup is available in select cities.</p>
          </div>
        </div>
      </section>
    </>
  );
}
