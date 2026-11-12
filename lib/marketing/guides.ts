/**
 * SEO guides (blog). Each guide targets one search people type on Google.
 * Plain data → rendered by app/(marketing)/guides/[slug]/page.tsx with Article + FAQ structured data.
 * To add a guide: append an object here. It is picked up by the guides index, the sitemap and internal links.
 */
export interface GuideSection {
  h2: string;
  paras: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  title: string; // <title> — keep the main keyword first, under ~65 chars
  description: string; // meta description, ~150 chars
  h1: string;
  intro: string;
  keywords: string[];
  image: string;
  published: string; // YYYY-MM-DD
  updated: string;
  readMins: number;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  /** Related product page under /for/<slug> */
  related: string[];
}

const D = "2026-11-12";

export const GUIDES: Guide[] = [
  {
    slug: "free-billing-software-for-restaurants",
    title: "Free Billing Software for Restaurants in India (2026) | Billo",
    description: "Looking for free restaurant billing software? See what a good free billing app should do, what to avoid, and how to start billing free with setup included.",
    h1: "Free billing software for restaurants in India: what to look for",
    intro: "Most small restaurants and tiffin centres don't need a costly POS system. A free billing app on your phone with a small Bluetooth printer can do the same job — if it has the right features.",
    keywords: ["free billing software", "free restaurant billing software", "free billing app", "free POS software India", "billing software free download"],
    image: "/food-library/meals.jpg",
    published: D,
    updated: D,
    readMins: 5,
    sections: [
      {
        h2: "Why many restaurants still use paper or a cash register",
        paras: [
          "Owners worry that billing software is costly, hard to learn, and needs a computer. Old billing machines are also slow to change prices and give no reports.",
          "Today a phone app can replace both — but only if it is simple enough for counter staff and fast during rush hour.",
        ],
      },
      {
        h2: "What a good free billing app must have",
        paras: ["Before you pick any free billing software, check that it does these basics well:"],
        list: [
          "Bills in a few taps with big item buttons and photos",
          "Prints on a Bluetooth thermal printer (58mm or 80mm) — no PC needed",
          "Token number on the bill for the kitchen",
          "Cash, UPI and card, plus split payment",
          "Udhaari (credit) for regular customers",
          "Daily sales report you can see from home",
          "Works when the internet is slow",
          "Staff logins so you know who billed what",
        ],
      },
      {
        h2: "Hidden costs to watch out for",
        paras: [
          "Some 'free' apps limit the number of bills, add a watermark, or lock printing and reports behind a paid plan. Others are free but have no one to help you set up the printer.",
          "Ask clearly: Is printing free? Are reports free? Is there a bill limit? Who helps me set it up?",
        ],
      },
      {
        h2: "How Billo works as free billing software",
        paras: [
          "Billo is free to use with unlimited bills, token printing, udhaari, staff logins and daily reports. We also set it up free — we connect your printer, load your menu and show a live demo with your own items.",
          "It runs on any Android phone, a tablet or a laptop with Chrome. Owners can check sales from any phone, including iPhone.",
        ],
      },
    ],
    faqs: [
      { q: "Is there really free billing software for restaurants?", a: "Yes. Billo is free to use with unlimited bills, Bluetooth printing, tokens, udhaari and reports, and setup is free too." },
      { q: "Do I need a computer for free billing software?", a: "No. Billo runs on an Android phone or tablet and prints on a Bluetooth thermal printer." },
    ],
    related: ["restaurant-billing-software", "billing-software", "free-billing-software"],
  },
  {
    slug: "how-to-print-bill-from-mobile-bluetooth-printer",
    title: "How to Print Bills from Mobile on a Bluetooth Printer | Billo",
    description: "Step-by-step: connect a Bluetooth thermal printer to your phone and print restaurant bills and tokens in seconds. Works with 58mm and 80mm printers.",
    h1: "How to print bills from your mobile on a Bluetooth thermal printer",
    intro: "You don't need a computer or a cash register to print bills. A phone and a small Bluetooth thermal printer are enough. Here is how to set it up.",
    keywords: ["print bill from mobile", "bluetooth printer billing app", "mobile bill printing", "thermal printer billing app", "how to connect bluetooth printer to phone"],
    image: "/food-library/coffee.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "What you need",
        paras: ["Just three things:"],
        list: [
          "An Android phone or tablet (or a laptop with Google Chrome)",
          "A 58mm or 80mm Bluetooth thermal receipt printer",
          "A billing app that prints directly — like Billo",
        ],
      },
      {
        h2: "Step-by-step setup",
        paras: ["The whole setup usually takes under 10 minutes:"],
        list: [
          "Charge the printer and load the thermal paper roll (shiny side facing the print head)",
          "Turn on Bluetooth and location on your phone",
          "Open Billo → Settings → Printer → Connect printer, and pick your printer from the list",
          "Tap Test print — you should get a short sample bill",
          "Choose a bill format (Classic, Quick Token, GST Invoice) and add your shop name and logo",
          "Make a bill and tap Print — it prints in about a second",
        ],
      },
      {
        h2: "58mm or 80mm printer?",
        paras: [
          "58mm printers are small, cheap to run and run on battery — great for tiffin centres, tea stalls and small counters. 80mm printers print wider bills and are better for restaurants with longer GST invoices.",
          "Billo works with most Bluetooth (BLE) thermal printers of both sizes.",
        ],
      },
      {
        h2: "Common problems and fixes",
        paras: [],
        list: [
          "Printer not found: turn printer off and on, keep it within 2 metres, and allow Bluetooth + location permission",
          "Blank paper: the roll is upside down — flip it",
          "Faint print: paper is low quality or battery is low",
          "Strange characters: use an app that prints the bill as an image for Indian languages — Billo does this automatically",
        ],
      },
    ],
    faqs: [
      { q: "Can I print bills from an iPhone?", a: "Apple blocks Bluetooth printing in iPhone browsers, so printing works best from an Android phone or a laptop with Chrome. On iPhone you can use the free Bluefy browser to print, and owners can view all reports on any iPhone." },
      { q: "Will you set up my printer?", a: "Yes. Billo sets up your printer and app free, at your counter or over a video call." },
    ],
    related: ["thermal-printer-billing", "mobile-billing-app"],
  },
  {
    slug: "mini-billing-machine-for-small-shop",
    title: "Mini Billing Machine for Small Shops – Best Option in 2026 | Billo",
    description: "Want a mini billing machine for your shop? Compare a traditional billing machine with a phone + Bluetooth printer setup, and see which saves more money.",
    h1: "Mini billing machine for small shops: old machine vs phone + printer",
    intro: "A mini billing machine helps small shops print bills quickly. Today you have two choices — a traditional billing machine, or your phone with a small thermal printer.",
    keywords: ["mini billing machine", "billing machine for small shop", "small billing machine", "portable billing machine", "billing machine for shop"],
    image: "/food-library/idli.jpg",
    published: D,
    updated: D,
    readMins: 5,
    sections: [
      {
        h2: "Option 1: Traditional billing machine",
        paras: [
          "A standalone billing machine has a small keypad and screen with a printer built in. It works, but adding or changing items is slow, the screen is tiny, and you can't see sales unless you're at the shop.",
        ],
      },
      {
        h2: "Option 2: Phone + Bluetooth printer (a modern mini billing machine)",
        paras: [
          "Your phone becomes the screen and keypad, and a palm-size Bluetooth printer prints the bill. Items have big buttons with photos, prices change in seconds, and reports reach your phone wherever you are.",
        ],
        list: [
          "Bigger, easier screen with photos and search",
          "Change menu and prices any time",
          "Token numbers, udhaari, GST bills and staff logins",
          "Daily sales on your phone from anywhere",
          "Printer runs on battery during power cuts",
        ],
      },
      {
        h2: "Which one should you choose?",
        paras: [
          "If you only need to print a total, any machine works. If you want speed in rush hour, udhaari tracking, reports and fewer mistakes, the phone + printer setup is better and costs less over time.",
        ],
      },
      {
        h2: "Get a mini billing machine set up free",
        paras: [
          "Billo is free to use. We help you choose a printer that works and set up the printer, app and menu at your counter for free — most shops start billing the same day.",
        ],
      },
    ],
    faqs: [
      { q: "Which is the best mini billing machine for a small shop?", a: "For most small shops, a phone with a 58mm Bluetooth thermal printer and a billing app like Billo is the most flexible and lowest-cost mini billing machine." },
      { q: "Does a mini billing machine need internet?", a: "Billo keeps billing even when the internet drops and syncs bills when it is back." },
    ],
    related: ["mini-billing-machine", "thermal-printer-billing"],
  },
  {
    slug: "tiffin-centre-billing-tokens-udhaari",
    title: "Tiffin Centre Billing: Tokens, Udhaari & Daily Sales | Billo",
    description: "How busy tiffin centres bill 300+ customers every morning: token printing, quick bills, udhaari for regulars and prepaid tiffin plans — all from a phone.",
    h1: "Tiffin centre billing: how to handle the morning rush",
    intro: "Idli, dosa, vada, poori — the morning rush at a tiffin centre is fast and loud. The right billing setup keeps the line moving and stops money leaking.",
    keywords: ["tiffin centre billing", "tiffin billing app", "idli dosa shop billing", "token system for tiffin centre", "udhaari app"],
    image: "/food-library/dosa.jpg",
    published: D,
    updated: D,
    readMins: 5,
    sections: [
      {
        h2: "Use big token numbers",
        paras: [
          "Print a large token number on every bill. The customer hands it to the kitchen, and you call the number when the plate is ready. Tokens should reset to 1 every morning automatically.",
        ],
      },
      {
        h2: "Keep the bill short",
        paras: [
          "A short 'Quick Token' bill saves paper and time. Long bills with full addresses slow down the counter — keep those for GST invoices only.",
        ],
      },
      {
        h2: "Track udhaari without a notebook",
        paras: [
          "Regular customers often eat daily and pay weekly. Put their bill on udhaari with one tap, and when they pay, show them exactly what they ate each day. Notebooks get lost; a khata on your phone doesn't.",
        ],
      },
      {
        h2: "Prepaid tiffin plans",
        paras: [
          "For monthly tiffin customers, use prepaid plans with a meals-left count and expiry reminders, so no one argues about how many meals are left.",
        ],
      },
      {
        h2: "Check sales and peak hours daily",
        paras: [
          "See which items sell most and which hours are busiest, so you prepare the right quantity and reduce waste.",
        ],
      },
    ],
    faqs: [
      { q: "What is the best billing app for a tiffin centre?", a: "Look for big token printing, quick bills, udhaari and prepaid tiffin plans. Billo has all of these and is free to use with free setup." },
      { q: "Can tokens reset every day?", a: "Yes. In Billo, token numbers start again from 1 each morning (India time) automatically." },
    ],
    related: ["tiffin-centre-billing-app", "token-printing-software"],
  },
  {
    slug: "gst-billing-for-restaurants",
    title: "GST Billing for Restaurants – Simple Guide (CGST/SGST) | Billo",
    description: "Simple guide to GST bills for small restaurants: what to print, CGST and SGST, GSTIN on bills, and how a billing app calculates tax automatically.",
    h1: "GST billing for restaurants: a simple guide",
    intro: "If your restaurant is registered under GST, your bills need a few extra details. A billing app can add them automatically so you don't calculate tax by hand.",
    keywords: ["GST billing software for restaurant", "restaurant GST bill", "CGST SGST bill", "GST invoice format restaurant", "GST billing app"],
    image: "/food-library/chicken-biryani.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "What a restaurant GST bill usually shows",
        paras: ["A typical GST bill includes:"],
        list: [
          "Restaurant name, address and GSTIN",
          "Bill number and date",
          "Items, quantity and price",
          "Taxable amount",
          "CGST and SGST (for sales within your state)",
          "Total amount",
        ],
      },
      {
        h2: "CGST and SGST in simple words",
        paras: [
          "For a sale inside your state, the GST rate is split in half — one half is CGST (central) and the other half is SGST (state). Your billing app should split it automatically.",
          "GST rates and rules can change. Always confirm the right rate for your business with your accountant or CA.",
        ],
      },
      {
        h2: "Not registered under GST?",
        paras: [
          "Small shops that are not registered should not charge GST. Use a simple bill or token format without tax — you can switch to a GST format later.",
        ],
      },
      {
        h2: "How Billo helps",
        paras: [
          "Add your GSTIN and tax rate once in Billo. It calculates CGST/SGST and prints a clean GST invoice format on your thermal printer, with a live preview before printing.",
        ],
      },
    ],
    faqs: [
      { q: "Does Billo print GST bills?", a: "Yes. Add your GSTIN and tax rate, and Billo prints a GST invoice with CGST and SGST calculated automatically." },
      { q: "Is this tax advice?", a: "No. This guide is general information. Please check the correct GST rate and rules for your business with a CA." },
    ],
    related: ["gst-billing-software", "restaurant-billing-software"],
  },
  {
    slug: "billing-app-vs-billing-machine",
    title: "Billing App vs Billing Machine – Which Is Better for Your Shop? | Billo",
    description: "Billing app on phone or a traditional billing machine? Compare speed, cost, reports, udhaari and ease of use to choose the right one for your counter.",
    h1: "Billing app vs billing machine: which is better?",
    intro: "Both print bills. The difference is everything around the bill — speed, menu changes, reports and control over staff and cash.",
    keywords: ["billing app vs billing machine", "billing machine", "billing app", "best billing machine for restaurant", "billing machine for hotel"],
    image: "/food-library/vada.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "Speed at the counter",
        paras: ["A billing app shows big buttons with photos and search. A machine needs item codes or small keys. In rush hour, the app is usually faster and has fewer mistakes."],
      },
      {
        h2: "Changing menu and prices",
        paras: ["In an app, you change a price in seconds from your phone. On many machines, it needs manual programming or a technician."],
      },
      {
        h2: "Reports and control",
        paras: ["Apps show today's sales, best sellers, cash vs UPI and who billed what — from anywhere. Machines usually only print a day-end total at the shop."],
      },
      {
        h2: "Udhaari, tokens and GST",
        paras: ["Modern billing apps add udhaari khata, token numbers, GST bills and staff logins. Most simple machines don't."],
      },
      {
        h2: "The verdict",
        paras: ["For most restaurants, tiffin centres and small shops, a billing app + Bluetooth printer is the better choice. Billo is free to use and we set it up free."],
      },
    ],
    faqs: [
      { q: "Is a billing app reliable during power cuts?", a: "Yes. The phone and a battery-powered Bluetooth printer keep working during power cuts, and Billo works when the internet is slow." },
    ],
    related: ["mobile-billing-app", "mini-billing-machine"],
  },
  {
    slug: "udhaari-khata-app-for-shops",
    title: "Udhaari Khata App for Shops & Restaurants – Track Credit Easily | Billo",
    description: "Stop losing money on udhaari. Track credit customers day by day, take part payments by cash or UPI, and send the statement on WhatsApp.",
    h1: "Udhaari khata app: track credit customers without a notebook",
    intro: "Udhaari keeps regular customers coming back — but notebook khatas get lost, smudged or argued about. A digital khata fixes that.",
    keywords: ["udhaari app", "khata app", "credit book app", "udhar khata", "khata app for restaurant"],
    image: "/food-library/tea.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "Problems with a paper khata",
        paras: [],
        list: ["Entries are missed in rush hour", "Customers dispute the total", "Notebook gets lost or damaged", "You can't see who owes how much at a glance"],
      },
      {
        h2: "How a digital udhaari khata works",
        paras: [
          "At billing, tap Udhaari instead of cash or UPI. The bill goes to that customer's khata automatically, with date and items. When they pay — full or part — record it by cash or UPI and the balance updates.",
        ],
      },
      {
        h2: "Show proof, avoid arguments",
        paras: ["Share the customer's statement on WhatsApp or print it: each day's items, amounts and payments, with the running balance."],
      },
    ],
    faqs: [
      { q: "Is the udhaari feature free in Billo?", a: "Yes. Udhaari khata is part of Billo, which is free to use." },
    ],
    related: ["tiffin-centre-billing-app", "restaurant-billing-software"],
  },
  {
    slug: "token-system-for-restaurant",
    title: "Token System for Restaurants & Canteens – How It Works | Billo",
    description: "Set up a simple token system for your restaurant, canteen or fast food counter: big token numbers on bills, daily reset and kitchen slips.",
    h1: "Token system for restaurants and canteens",
    intro: "A token system stops shouting and confusion at the counter. Customers pay, get a number, and collect food when it's called.",
    keywords: ["token system for restaurant", "token printing", "token number billing", "canteen token system", "token printer"],
    image: "/food-library/poori.jpg",
    published: D,
    updated: D,
    readMins: 3,
    sections: [
      {
        h2: "How a token system works",
        paras: [],
        list: ["Customer orders and pays at the counter", "Bill prints with a big token number", "Kitchen prepares by token number", "Staff call the number when food is ready"],
      },
      {
        h2: "What makes a good token system",
        paras: ["Large, easy-to-read numbers; automatic reset every morning; and optional kitchen slips so the kitchen gets its own copy."],
      },
      {
        h2: "Set it up with Billo",
        paras: ["Billo prints a large token number on every bill from your phone and a Bluetooth printer. It's free to use and we set it up free."],
      },
    ],
    faqs: [
      { q: "Do I need a separate token machine?", a: "No. Billo prints the token number on the bill itself, so one Bluetooth printer is enough." },
    ],
    related: ["token-printing-software", "fast-food-billing-software"],
  },
  {
    slug: "how-to-reduce-cash-leakage-in-restaurant",
    title: "How to Stop Cash Leakage at Your Restaurant Counter | Billo",
    description: "Practical ways to stop cash leakage: staff logins, cancel and refund records, shift cash tallies and daily closing — explained for small restaurants.",
    h1: "How to stop cash leakage at your restaurant counter",
    intro: "Small daily losses at the counter add up to a big amount every month. A few simple controls fix most of it.",
    keywords: ["restaurant cash management", "cash leakage restaurant", "restaurant staff control", "day closing report", "cashier shift report"],
    image: "/food-library/meals.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "Give every staff member their own login",
        paras: ["When everyone bills with their own login, every bill, discount, cancel and refund shows who did it."],
      },
      {
        h2: "Limit who can cancel, refund or give discounts",
        paras: ["Let cashiers bill, but keep cancellations, refunds and discounts for managers or the owner — with a reason recorded every time."],
      },
      {
        h2: "Close every shift and day",
        paras: ["At shift end, compare expected cash with actual cash in the drawer. Differences show up the same day, not at month end."],
      },
      {
        h2: "Check reports from your phone",
        paras: ["Look at today's sales, cash vs UPI and cancelled bills every evening, even when you're not at the shop."],
      },
    ],
    faqs: [
      { q: "Does Billo show who cancelled a bill?", a: "Yes. Every cancellation and refund records the staff member, time and reason." },
    ],
    related: ["restaurant-billing-software", "billing-software"],
  },
  {
    slug: "best-billing-app-for-small-business-india",
    title: "Best Billing App for Small Business in India – Checklist | Billo",
    description: "Choosing a billing app for your small business in India? Use this checklist: printing, GST, udhaari, staff, offline billing, language and support.",
    h1: "Best billing app for small business in India: a checklist",
    intro: "There are many billing apps. Use this checklist to find one that fits a busy Indian counter — not just an office.",
    keywords: ["best billing app India", "billing app for small business", "billing software for shop", "billing app for shop", "simple billing app"],
    image: "/food-library/milk-sweets.jpg",
    published: D,
    updated: D,
    readMins: 4,
    sections: [
      {
        h2: "The checklist",
        paras: [],
        list: [
          "Fast billing with big buttons (rush-hour ready)",
          "Direct Bluetooth printing — no PDF or print dialog",
          "Token numbers for food businesses",
          "GST bills when you need them",
          "Udhaari / credit khata",
          "Staff logins and audit of cancels and refunds",
          "Keeps billing when the internet is slow",
          "Bills in your language",
          "Real people for setup and support",
          "Clear pricing — or free",
        ],
      },
      {
        h2: "Questions to ask before you choose",
        paras: ["Who will set it up? What happens if the printer stops working? Can I see sales from home? Is there a bill limit?"],
      },
      {
        h2: "Where Billo fits",
        paras: ["Billo is made for Indian food businesses and small shops. It is free to use, with free setup, a free demo with your own menu, and WhatsApp support in Hindi, English and Telugu."],
      },
    ],
    faqs: [
      { q: "Is Billo only for restaurants?", a: "Billo is built for food businesses — restaurants, tiffin centres, fast food, cafés, bakeries, sweet shops and juice shops — and works for many small counters." },
    ],
    related: ["billing-software", "mobile-billing-app"],
  },
];
