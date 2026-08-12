# Indian POS & Business Management App

Mobile-first POS, billing, inventory, and business-intelligence app for small
Indian food businesses (tiffin centers, mini restaurants, tea shops,
bakeries, cafes). Built with Next.js App Router, TypeScript, Tailwind v4,
PostgreSQL + Prisma, Auth.js, Zod, React Hook Form, Zustand, and a PWA/
IndexedDB offline layer.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and AUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed           # optional: sample business + products
npm run dev
```

Sign in with the seeded account: `owner@demo.shop` / `password123`, or
register a new business at `/register`.

> **Note on this environment:** the schema was authored and reviewed by hand
> but `prisma generate`/`migrate` could not be executed in the sandbox this
> was built in (Prisma's engine binaries are hosted at `binaries.prisma.sh`,
> which wasn't network-reachable there). Run `npx prisma generate` as your
> very first step locally -- everything importing `@prisma/client` types
> depends on it.

## What's implemented (Phase 1 + foundations)

- **Full Prisma schema** for all 10 core + 3 differentiator features (see
  `prisma/schema.prisma`) -- Phases 2-4 build UI against models that already
  exist, nothing there requires a schema migration to get started.
- **Auth** -- Auth.js credentials provider, `requireSession()` server helper,
  role-based `can()` permission map (OWNER/MANAGER/CASHIER).
- **POS billing screen** (`/billing`) -- responsive mobile/tablet/desktop
  layouts, category tabs, product search (name/SKU/barcode, scanner-as-
  keyboard support), cart with item- and bill-level discounts, split
  payments (Cash/UPI/Card/Credit), hold/resume bills.
- **Checkout transaction** (`/api/billing/checkout`) -- server-authoritative
  GST + discount calculation, one Prisma transaction covering order ->
  invoice -> payments -> inventory deduction -> recipe-ingredient deduction
  -> credit ledger -> audit log, exactly per spec section 19.
- **Printing** -- vendor-agnostic `ReceiptPrinter` interface with a working
  browser-based adapter for 58mm/80mm/A4, wired to a print/PDF/share modal.
- **Offline billing** -- IndexedDB queue (`lib/offline/db.ts`), sync engine
  with retry (`lib/offline/sync.ts`), a service worker for app-shell
  caching, and a live online/syncing/offline indicator. `submitBill()` tries
  the network first and falls back to the offline queue transparently.
- **Products** (`/products`) -- search/filter, add product form, soft delete.
- **Dashboard** (`/dashboard`) -- today's KPIs, low-stock count, outstanding
  credit, active tiffin plans, and a rule-based Business Alerts feed (no
  chatbot, per spec section 15 -- thresholds against live data only).
- **Settings** -- printer type selection; business GST fields are read-only
  pending a Phase 2 settings form.

## What's stubbed (Phases 2-4)

`/sales`, `/inventory`, `/customers`, `/expenses`, `/tiffin`, `/reports`,
`/staff` render a `PhasePlaceholder` naming exactly which Prisma models
they'd read/write -- the data layer is ready, only the API routes + UI
remain. Suggested build order, matching spec section 26:

1. **Phase 2** -- Inventory adjustments UI, Sales reports (daily/weekly/
   monthly, product/payment/cashier-wise), Customers + Udhaari ledger UI,
   Expenses CRUD, Staff invite/role management, Day Closing screen.
2. **Phase 3** -- the offline layer above is already built; what's left is
   end-to-end testing against a real flaky connection and wiring the
   `ConnectionStatus`/sync engine into the held-bills flow too.
3. **Phase 4** -- Recipe editor UI (schema + ingredient deduction already
   live in checkout), Tiffin plan/subscription screens, and expanding
   `lib/insights/getBusinessInsights.ts` with week-over-week sales-drop and
   food-cost alerts once Sales/Expenses history exists.

## Key architectural decisions

- **Server-authoritative money**: the client never sends a final price or
  total -- only product ids, quantities, and requested discounts. All GST/
  discount math happens in `lib/billing/calculateTotals.ts` against live DB
  prices, inside the same transaction that writes the invoice.
- **Printer abstraction**: billing code only imports `ReceiptPrinter` from
  `lib/printing/types.ts`. A new thermal SDK or cloud print integration is
  a new file + one line in `getPrinterAdapter.ts` -- no billing code changes.
- **Offline-first submit**: `submitBill()` is the single entry point UI
  calls; it decides network vs. queue so POS components don't need to know
  about connectivity state at all.
- **Permissions as data, not scattered `if`s**: every gate-able action is a
  string literal in `lib/permissions/index.ts`; API routes call
  `assertPermission(role, "x.y")` rather than re-deriving role logic.

## Known follow-ups

- Business GST settings form (currently read-only display).
- Printer CRUD API (`PrinterSettings.tsx` has a marked extension point).
- Day Closing cash-count screen (schema ready: `DayClosing`).
- Camera barcode scanning (button present in `ProductSearch.tsx`, wired to
  nothing yet -- USB/Bluetooth HID scanners already work via the search
  input's Enter-key handler).

## UI/UX + Speed + PWA + i18n pass (latest)

- **Design**: reworked to an emerald + vibrant-yellow palette, rounded cards, soft shadows, smooth micro-interactions — replaces the earlier flat/square "steel-ledger" look per updated direction.
- **Two-click billing**: the POS's primary action is now **PRINT BILL** — tap it and the sale checks out with a default cash payment and prints automatically, no payment-method prompt in the way. The full split-payment/credit flow is still there behind a secondary "Split / Credit" button — nothing was removed.
- **Cloudinary**: product photo uploads go to Cloudinary (`lib/cloudinary.ts`), not local disk — this also fixes a real bug where local uploads didn't survive Vercel's ephemeral filesystem.
- **Toasts, skeletons, spinners**: `stores/toastStore.ts` + `components/ui/Toaster.tsx`, `components/ui/Skeleton.tsx`, and `Button` now has a built-in `loading` state. Wired into checkout, printing, holding a bill, and product/expense saves as a starting set — extend the same pattern (`toast.success(...)` / `toast.error(...)`) to other flows as needed.
- **PWA install prompt**: `hooks/usePwaInstall.ts` + `components/dashboard/InstallAppCard.tsx`, shown in Settings. Handles the native Chrome/Edge prompt, iOS Safari's manual "Add to Home Screen" steps, and shows "✓ App Installed" once installed.
- **Touch behavior**: `.no-select` (see `globals.css`) applied to buttons, product tiles, category tabs, and nav so dragging across the POS doesn't accidentally highlight text — inputs/textareas explicitly keep normal selection.
- **i18n**: `lib/i18n/` — a real translation dictionary + React context (`LanguageProvider`/`useT`), backed by `Business.language` in the database, switches instantly and persists across logins. **Coverage so far**: navigation, the POS/billing screen, common actions, auth, and toast messages, across all 10 required languages (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi). Extending coverage to a given screen (Expenses, Reports, Staff, etc.) means replacing its hardcoded strings with `t("namespace.key")` calls and adding those keys to `lib/i18n/translations.ts` — the system supports it, it's just not done for every screen yet.

### Not done in this pass
- Full app-wide translation of every screen's every string (explicitly out of scope for one pass — flagged up front).
- Deep speed/caching work (React Query-style caching of products/categories/settings, broader `"use client"` audit) — the two-click billing flow and existing debounced search cover the most user-visible speed win, but a systematic caching pass is still open.

## Bug fixes + navigation/profile pass (latest)

- **Fixed "stuck after billing"**: the previous auto-print tried to open a print window from a background effect with no direct user tap — mobile browsers silently block that (no error, just a frozen-feeling screen). Printing is now always one explicit tap, which is also what makes it reliable.
- **Bluetooth is now actually asked for**: opening the receipt screen checks for a paired Bluetooth printer and, if none is paired, leads with "Connect your Bluetooth printer" before offering to print — with a "Print without Bluetooth" escape hatch for anyone using browser/A4 printing instead. Note: pairing lets you select a Bluetooth device, but actual print output still goes through the browser's print dialog (`window.print()`) — raw ESC/POS printing straight to a Bluetooth thermal printer's characteristic is hardware/model-specific and not something that can be built generically; that would be a real, separate follow-up per printer model if needed.
- **Products page was missing from mobile** — it wasn't in the bottom nav or the "More" hub at all. Added, along with a full page-by-page audit of the More hub so every screen is reachable on mobile.
- **Profile page** added (`/profile`) with a top navbar (mobile) and a clickable business/role header (desktop sidebar) linking to it — shows identity, business, role, and sign-out.
- **Dashboard charts**: a 7-day sales trend bar chart and payment-method breakdown pie chart, both skeleton-loading while fetching.
- **Products CRUD completed**: Edit was the missing piece (Create/Read/Delete already existed) — now a full edit sheet with image, price, GST, and stock fields.
