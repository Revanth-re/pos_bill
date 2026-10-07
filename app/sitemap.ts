import type { MetadataRoute } from "next";
import { SITE, USE_CASES, CITIES } from "@/lib/marketing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({ url: `${SITE.url}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("", 1, "weekly"),
    page("/pricing", 0.9, "weekly"),
    page("/features", 0.8),
    page("/hi", 0.8),
    page("/te", 0.7),
    page("/contact", 0.7),
    ...USE_CASES.map((u) => page(`/for/${u.slug}`, 0.8)),
    ...CITIES.map((c) => page(`/billing-software/${c.slug}`, 0.7)),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
  ];
}
