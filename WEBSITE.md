# Billo website (inside the app)

The public website and the billing app are now ONE project at **https://getbillo.vercel.app**.

| Address | What |
|---|---|
| `/` `/pricing` `/features` `/hi` `/te` `/contact` `/privacy` `/terms` | Public website (SEO) |
| `/for/<business-type>`, `/billing-software/<city>` | Keyword landing pages |
| `/login`, `/dashboard`, `/billing`, … | Billing app (login required, hidden from Google) |

- Website code: `app/(marketing)/`, `components/marketing/`, content + prices in **`lib/marketing/site.ts`**.
- "Get Billo" installs the real Billo app (one tap on Android Chrome). Installed app opens `/login` → dashboard, no address bar.
- `sitemap.xml` + `robots.txt` are generated automatically.

## Google setup (do once)
1. Search Console → Add property → **URL prefix** → `https://getbillo.vercel.app/` → **HTML tag**.
2. Vercel (getbillo project) → Settings → Environment Variables →
   `NEXT_PUBLIC_GOOGLE_VERIFICATION = <content value>` → Redeploy → **Verify**.
3. Sitemaps → submit `sitemap.xml`. URL Inspection → Request indexing for `/`, `/pricing`, `/hi`.

## Own domain later
Add the domain in Vercel, then set `NEXT_PUBLIC_SITE_URL = https://yourdomain.in` and redeploy.
