import type { MetadataRoute } from "next";
import { SITE } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [
      {
        userAgent: "*",
        allow: "/",
        // Billing app screens are private — keep them out of Google.
        disallow: ["/api/", "/login", "/register", "/forgot-password", "/dashboard", "/billing$", "/billing/", "/bills", "/sales", "/products", "/inventory", "/customers", "/udhaari", "/expenses", "/tiffin", "/reports", "/day-closing", "/staff", "/shifts", "/performance", "/settings", "/profile", "/more", "/admin", "/outlets"],
      },
    ], sitemap: `${SITE.url}/sitemap.xml`, host: SITE.url };
}
