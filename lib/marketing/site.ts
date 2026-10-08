export const SITE = {
  name: "Billo",
  // Live website address. Override with NEXT_PUBLIC_SITE_URL in Vercel when you move to a custom domain (e.g. https://usebillo.in).
  url: (/pos-bill-gamma|billo-quick/.test(process.env.NEXT_PUBLIC_SITE_URL || "") ? "https://getbillo.vercel.app" : process.env.NEXT_PUBLIC_SITE_URL || "https://getbillo.vercel.app").replace(/\/$/, ""),
  appUrl: "/dashboard",
  // "Get Billo" → app login with the install sheet opened automatically
  installUrl: "/login?install=1",
  loginUrl: "/login",
  tagline: "Fast billing for Indian restaurants",
  description:
    "Billo is a fast restaurant billing app for India — token printing on Bluetooth thermal printers, udhaari (credit) khata, tiffin plans, GST bills, staff, cash and daily reports. Works on your phone. Plans from ₹299.",
  phone: "+91 76709 15570",
  phoneRaw: "917670915570",
  email: "revanthrevi131@gmail.com",
  region: "India",
};

export const whatsapp = (text = "Hi Billo, I want a demo for my restaurant.") =>
  `https://wa.me/${SITE.phoneRaw}?text=${encodeURIComponent(text)}`;

export const PLANS = [
  {
    id: "starter",
    name: "First-time offer",
    price: 299,
    period: "3 months",
    perMonth: "≈ ₹100 / month",
    badge: "New customers",
    features: ["Full Billo app", "Unlimited bills & tokens", "Udhaari khata & tiffin plans", "Use on your own phone", "WhatsApp support"],
    cta: "Start for ₹299",
  },
  {
    id: "half",
    name: "6 months",
    price: 599,
    period: "6 months",
    perMonth: "≈ ₹100 / month",
    features: ["Everything in the offer", "Staff logins & roles", "Shifts & day closing", "Sales & staff reports", "WhatsApp support"],
    cta: "Choose 6 months",
  },
  {
    id: "year",
    name: "1 year",
    price: 999,
    period: "12 months",
    perMonth: "≈ ₹83 / month — best value",
    badge: "Most popular",
    highlight: true,
    features: ["Everything in 6 months", "Lowest monthly cost", "Priority WhatsApp support", "Free bill-format setup", "All new features"],
    cta: "Choose 1 year",
  },
] as const;

export const KIT = {
  name: "Billo Counter Kit",
  price: 4799,
  features: [
    "58mm Bluetooth thermal printer",
    "Same-day setup (on video call or at your shop)",
    "Menu + product photos loaded for you",
    "1 year Billo app access — FREE",
    "Staff training on billing & tokens",
  ],
};

export const FEATURES = [
  { icon: "Zap", title: "Bill in 3 seconds", text: "Tap items, tap Print. Big buttons, categories, search and one-tap quantities — built for rush hour." },
  { icon: "Ticket", title: "Token on every bill", text: "A large daily token number prints on top. Customer hands it to the kitchen — your workflow stays the same." },
  { icon: "Printer", title: "Bluetooth thermal printing", text: "Prints straight to 58mm / 80mm printers from your phone. No PC, no print dialogs, no PDF." },
  { icon: "HandCoins", title: "Udhaari khata", text: "Regulars eat now, pay later. See day-by-day what they ate, take part payments, send statement on WhatsApp." },
  { icon: "UtensilsCrossed", title: "Tiffin & meal plans", text: "Prepaid tiffin subscriptions with meals left, expiry reminders and daily usage tracking." },
  { icon: "ReceiptText", title: "Bills, reprint & refunds", text: "Search any bill, reprint, cancel or refund with reason — every action recorded with who did it." },
  { icon: "Users", title: "Staff & roles", text: "Owner, manager and cashier logins. Cashiers bill; only managers can cancel, refund or give discounts." },
  { icon: "Wallet", title: "Cash, UPI, card & shifts", text: "Split payments, cashier shifts and day closing with expected vs actual cash — no more drawer guesswork." },
  { icon: "BarChart3", title: "Owner dashboard", text: "Today's sales, orders, average bill, best sellers and peak hours — understand your day in 5 seconds." },
  { icon: "FileText", title: "GST-ready bills", text: "CGST/SGST, GSTIN and multiple bill formats with live preview — Classic, Quick Token, GST Invoice and more." },
  { icon: "WifiOff", title: "Works when net is slow", text: "Keep billing during network drops — bills sync automatically when you're back online." },
  { icon: "Smartphone", title: "Your phone is the POS", text: "Bill on Android phones, tablets or a laptop with Chrome. Owners check reports from any phone — even iPhone." },
] as const;

export const FAQS = [
  { q: "What is Billo?", a: "Billo is a restaurant billing (POS) app made for Indian food businesses — restaurants, tiffin centres, fast food, bakeries and cafes. It prints bills and tokens on a Bluetooth thermal printer, tracks udhaari, tiffin plans, staff, cash and daily sales." },
  { q: "How much does Billo cost?", a: "App-only plans: ₹299 for the first 3 months (first-time offer), ₹599 for 6 months, or ₹999 for 1 year. The Billo Counter Kit is ₹4,799 and includes a 58mm Bluetooth printer, setup at your shop and 1 year of the app free." },
  { q: "Do I need a computer?", a: "No. Billo runs on an Android phone or tablet, or a laptop with Google Chrome, and the thermal printer connects over Bluetooth. Owners can view reports from any phone, including iPhone." },
  { q: "Which printers work with Billo?", a: "Most 58mm and 80mm Bluetooth (BLE) thermal receipt printers work. If you buy the Counter Kit, we give you a tested printer and set it up." },
  { q: "Can I track udhaari (credit) for regular customers?", a: "Yes. Bill to a customer's udhaari with one tap. When they pay, open their khata to see each day's items and amount, take full or part payment by cash/UPI, and send the statement on WhatsApp." },
  { q: "Does Billo support GST bills?", a: "Yes. Add your GSTIN and tax rates; Billo calculates CGST/SGST and prints a GST invoice format. You can also use a short token-only format for fast counters." },
  { q: "Can my staff use it on their own phones?", a: "Yes. Create owner, manager and cashier logins. Multiple people can bill at once, and every bill, cancellation and refund shows who did it." },
  { q: "Is Billo available all over India?", a: "Yes. We ship the printer anywhere in India and set up Billo with you over a video call — most shops start billing the same day. Support on WhatsApp and phone in Hindi, English and Telugu." },
  { q: "What if the internet goes off?", a: "Billo keeps billing during network drops and syncs the bills automatically when the connection returns." },
] as const;

export interface UseCase {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  points: { title: string; text: string }[];
  keywords: string[];
  image: string;
}

export const USE_CASES: UseCase[] = [
  {
    slug: "restaurant-billing-software",
    name: "Restaurants",
    title: "Restaurant Billing Software in India | Billo",
    description: "Fast restaurant billing software with token printing, GST bills, udhaari, staff logins and daily reports. Runs on your phone with a Bluetooth printer. From ₹299.",
    h1: "Restaurant billing software that keeps up with rush hour",
    intro: "Billo replaces the old cash register with a fast, clean billing app on your phone — same counter workflow, far less hassle.",
    points: [
      { title: "Token + bill in one print", text: "Big token number on top so the kitchen knows the order — no extra kitchen software needed." },
      { title: "Dine-in & takeaway", text: "Switch order type in one tap; hold bills for waiting customers and resume later." },
      { title: "Staff accountability", text: "Every bill, discount, cancellation and refund records which staff member did it." },
      { title: "Owner reports on your phone", text: "Today's sales, cash vs UPI, best-selling items and cashier performance — anywhere." },
    ],
    keywords: ["restaurant billing software", "restaurant POS India", "restaurant billing app", "hotel billing software"],
    image: "/food-library/meals.jpg",
  },
  {
    slug: "tiffin-centre-billing-app",
    name: "Tiffin centres",
    title: "Tiffin Centre Billing App with Token Printing | Billo",
    description: "Billing app for tiffin centres — idli, dosa, vada in seconds, large token printing, udhaari khata and prepaid tiffin plans. Works across India. From ₹299.",
    h1: "The billing app built for busy tiffin centres",
    intro: "Morning rush, 300 tokens, regulars on udhaari — Billo is made for exactly that.",
    points: [
      { title: "Quick Token bill format", text: "Huge token number, short bill — saves paper and time at the counter." },
      { title: "Udhaari for regulars", text: "Daily customers eat now and pay weekly or monthly — every day's items are tracked." },
      { title: "Prepaid tiffin plans", text: "Monthly meal subscriptions with meals-left count and expiry reminders." },
      { title: "Peak-hour insights", text: "See your busiest hours and best sellers so you prepare the right quantity." },
    ],
    keywords: ["tiffin centre billing app", "tiffin billing software", "idli dosa shop billing", "token billing app"],
    image: "/food-library/idli.jpg",
  },
  {
    slug: "fast-food-billing-software",
    name: "Fast food",
    title: "Fast Food & Chinese Counter Billing Software | Billo",
    description: "Billing software for fast food, Chinese and biryani counters — one-tap items, token printing, UPI/cash split and shift cash tallies. From ₹299.",
    h1: "Fast food billing that's actually fast",
    intro: "Fried rice, noodles, biryani — tap, print, next customer.",
    points: [
      { title: "One-tap menu with photos", text: "Large product tiles with photos so new staff bill correctly from day one." },
      { title: "UPI + cash split", text: "Take part cash, part UPI on the same bill and see exact totals per method." },
      { title: "Shift cash tally", text: "Opening cash, cash sales and counted cash — differences are caught the same night." },
      { title: "Kitchen slip option", text: "Print the customer bill and a separate kitchen slip with just the items and token." },
    ],
    keywords: ["fast food billing software", "chinese counter billing", "biryani shop billing app"],
    image: "/food-library/chicken-biryani.jpg",
  },
  {
    slug: "cafe-pos-software",
    name: "Cafés & tea stalls",
    title: "Café & Tea Stall Billing App (POS) | Billo",
    description: "Simple POS for cafés, tea and coffee stalls — tap to bill, Bluetooth receipt printer, UPI tracking and daily sales on your phone. From ₹299.",
    h1: "A simple POS for cafés and tea stalls",
    intro: "Small tickets, huge volume. Billo keeps every tea and coffee counted.",
    points: [
      { title: "Favourites first", text: "Your top items on the first screen — bill a chai in one tap." },
      { title: "Compact paper-saver bills", text: "Shortest bill format so a thermal roll lasts longer." },
      { title: "UPI reconciliation", text: "End-of-day split of cash vs UPI matches your bank and drawer." },
      { title: "Works on one phone", text: "No computer needed — your phone and a small Bluetooth printer are enough." },
    ],
    keywords: ["cafe pos software", "tea stall billing app", "coffee shop billing software"],
    image: "/food-library/coffee.jpg",
  },
  {
    slug: "bakery-billing-software",
    name: "Bakeries & sweet shops",
    title: "Bakery & Sweet Shop Billing Software | Billo",
    description: "Bakery and sweet shop billing with stock tracking, low-stock alerts, GST bills and Bluetooth printing. Runs on your phone. From ₹299.",
    h1: "Bakery and sweet shop billing with stock control",
    intro: "Track every cake, puff and sweet box — and know what's running low before evening.",
    points: [
      { title: "Stock & low-stock alerts", text: "Stock reduces automatically with each bill and alerts you when items run low." },
      { title: "GST invoice format", text: "Print GSTIN and CGST/SGST break-up for customers who need a proper invoice." },
      { title: "Credit for regular buyers", text: "Track udhaari for hotels and shops that buy in bulk and pay later." },
      { title: "Daily best sellers", text: "See which items sell most so you bake the right quantity." },
    ],
    keywords: ["bakery billing software", "sweet shop billing app", "bakery pos india"],
    image: "/food-library/poori.jpg",
  },
];

export interface City {
  slug: string;
  name: string;
  state: string;
  areas: string[];
}

// Major food-business cities across India — each gets its own SEO page.
export const CITIES: City[] = [
  { slug: "delhi", name: "Delhi", state: "Delhi", areas: ["Connaught Place", "Karol Bagh", "Lajpat Nagar", "Rohini", "Dwarka"] },
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", areas: ["Andheri", "Dadar", "Thane", "Navi Mumbai", "Borivali"] },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", areas: ["Koramangala", "BTM Layout", "Marathahalli", "Jayanagar", "Electronic City"] },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", areas: ["Ameerpet", "Kukatpally", "Madhapur", "Dilsukhnagar", "Secunderabad"] },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", areas: ["T. Nagar", "Velachery", "Anna Nagar", "Tambaram", "Adyar"] },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", areas: ["Salt Lake", "Park Street", "Howrah", "New Town", "Gariahat"] },
  { slug: "pune", name: "Pune", state: "Maharashtra", areas: ["Kothrud", "Hinjewadi", "Viman Nagar", "Hadapsar", "Shivajinagar"] },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", areas: ["Navrangpura", "Maninagar", "Satellite", "Vastrapur"] },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", areas: ["Malviya Nagar", "Vaishali Nagar", "C-Scheme", "Mansarovar"] },
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", areas: ["Hazratganj", "Gomti Nagar", "Aminabad", "Aliganj"] },
  { slug: "chandigarh", name: "Chandigarh", state: "Chandigarh", areas: ["Sector 17", "Sector 35", "Mohali", "Panchkula"] },
  { slug: "kochi", name: "Kochi", state: "Kerala", areas: ["Edappally", "Kakkanad", "MG Road", "Fort Kochi"] },
  { slug: "coimbatore", name: "Coimbatore", state: "Tamil Nadu", areas: ["Gandhipuram", "RS Puram", "Peelamedu"] },
  { slug: "indore", name: "Indore", state: "Madhya Pradesh", areas: ["Vijay Nagar", "Palasia", "Rajwada"] },
  { slug: "surat", name: "Surat", state: "Gujarat", areas: ["Adajan", "Vesu", "Varachha"] },
  { slug: "nagpur", name: "Nagpur", state: "Maharashtra", areas: ["Sitabuldi", "Dharampeth", "Sadar"] },
  { slug: "bhopal", name: "Bhopal", state: "Madhya Pradesh", areas: ["MP Nagar", "New Market", "Arera Colony"] },
  { slug: "patna", name: "Patna", state: "Bihar", areas: ["Boring Road", "Kankarbagh", "Fraser Road"] },
  { slug: "vijayawada", name: "Vijayawada", state: "Andhra Pradesh", areas: ["Benz Circle", "Governorpet", "Patamata"] },
  { slug: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", areas: ["MVP Colony", "Dwaraka Nagar", "Gajuwaka"] },
];
