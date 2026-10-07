import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({ crumbs, eyebrow, title, text, children }: { crumbs: { name: string; href: string }[]; eyebrow?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(60%_80%_at_85%_0%,rgba(242,210,27,.16),transparent),radial-gradient(50%_70%_at_0%_0%,rgba(7,94,99,.10),transparent)]">
      <div className="container-x py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link href="/" className="hover:text-brand">Home</Link>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={c.href} className="hover:text-brand">{c.name}</Link>
            </span>
          ))}
        </nav>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.08] text-ink">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{text}</p>}
        {children}
      </div>
    </section>
  );
}
