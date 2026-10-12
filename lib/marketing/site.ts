export const SITE = {
  name: "Billo",
  // Official website address — used for Google (canonical, sitemap, structured data).
  url: "https://getbillo.in",
  appUrl: "/dashboard",
  // "Get Billo" → app login with the install sheet opened automatically
  installUrl: "/login?install=1",
  loginUrl: "/login",
  tagline: "Fast billing for Indian restaurants",
  description:
    "Billo (getbillo.in) is a fast billing software and mobile billing app for India — print bills and tokens on a Bluetooth thermal printer, mini billing machine for shops & restaurants, udhaari khata, GST bills and daily reports. From ₹299.",
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
  { q: "What is Billo?", a: "Billo (getbillo.in) is a billing software and mobile billing app made for Indian businesses — restaurants, tiffin centres, fast food, bakeries and cafes. It prints bills and tokens on a Bluetooth thermal printer, tracks udhaari, tiffin plans, staff, cash and daily sales." },
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
  /** Keyword (topic) pages: custom eyebrow + WhatsApp text instead of "Billo for <business>". */
  eyebrow?: string;
  waText?: string;
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

  // ---- Search-topic pages (billing software, mobile billing, thermal printer, token print…) ----
  {
    slug: "billing-software",
    name: "Billing software",
    eyebrow: "Billing software",
    waText: "Hi Billo, I want a demo of your billing software.",
    title: "Billing Software for Shops & Restaurants in India | Billo (getbillo.in)",
    description: "Billo is simple billing software for India — make a bill in 3 seconds, print on a thermal printer, GST bills, udhaari and daily reports on your phone. From ₹299.",
    h1: "Simple billing software for every Indian shop",
    intro: "Billo (getbillo.in) is billing software that runs on your phone. Tap items, print the bill, done — no computer, no training needed.",
    points: [
      { title: "Bill in 3 seconds", text: "Big buttons, item photos and search — billing is faster than writing by hand." },
      { title: "Prints on any thermal printer", text: "58mm and 80mm Bluetooth thermal printers, no PC or print dialog." },
      { title: "GST & simple bills", text: "Short bills for the counter or full GST invoices with CGST/SGST." },
      { title: "Reports on your phone", text: "Today's sales, cash vs UPI and best sellers — anywhere." },
    ],
    keywords: ["billing software", "billing software India", "simple billing software", "billing app", "bill software", "billing services"],
    image: "/food-library/meals.jpg",
  },
  {
    slug: "mobile-billing-app",
    name: "Mobile billing",
    eyebrow: "Mobile billing app",
    waText: "Hi Billo, I want to try mobile billing on my phone.",
    title: "Mobile Billing App with Bluetooth Printer | Billo (getbillo.in)",
    description: "Turn your Android phone into a billing machine. Billo mobile billing app prints bills and tokens on a Bluetooth thermal printer. Works across India. From ₹299.",
    h1: "Mobile billing — your phone is the billing machine",
    intro: "No billing computer needed. Billo turns any Android phone or tablet into a fast billing counter that prints on a small Bluetooth printer.",
    points: [
      { title: "Bill from your phone", text: "Billing, printing and reports all from one phone — staff can use their own phones too." },
      { title: "Pocket-size printer", text: "A 58mm Bluetooth printer connects in seconds and prints the bill instantly." },
      { title: "Works when net is slow", text: "Keep billing during network drops; bills sync automatically." },
      { title: "Install like an app", text: "Install Billo on your home screen from getbillo.in — opens full-screen like any app." },
    ],
    keywords: ["mobile billing", "mobile billing app", "billing app for android", "phone billing app", "mobile bill print"],
    image: "/food-library/dosa.jpg",
  },
  {
    slug: "mini-billing-machine",
    name: "Mini billing machine",
    eyebrow: "Mini billing machine",
    waText: "Hi Billo, I need a mini billing machine for my shop.",
    title: "Mini Billing Machine for Shops – Phone + Thermal Printer Kit | Billo",
    description: "Billo Counter Kit: a mini billing machine with 58mm Bluetooth thermal printer, setup and 1 year app free for ₹4,799. Perfect for small shops, tiffin centres and cafes.",
    h1: "A mini billing machine that fits on any counter",
    intro: "The Billo Counter Kit is a complete mini billing machine — your phone plus a compact thermal printer, set up and ready to bill the same day.",
    points: [
      { title: "Complete kit ₹4,799", text: "58mm Bluetooth thermal printer, setup at your shop and 1 year of Billo free." },
      { title: "Small & portable", text: "Takes less space than a cash register; runs on battery when power goes." },
      { title: "Bills with token number", text: "Every bill can print a big token number for the kitchen or counter." },
      { title: "Support on WhatsApp", text: "Help in Hindi, English and Telugu whenever you need it." },
    ],
    keywords: ["mini billing machine", "mini billing", "billing machine for shop", "small billing machine", "portable billing machine", "billing machine price"],
    image: "/food-library/idli.jpg",
  },
  {
    slug: "thermal-printer-billing",
    name: "Thermal printer billing",
    eyebrow: "Thermal printer billing",
    waText: "Hi Billo, I want to print bills on a thermal printer.",
    title: "Thermal Printer Billing App – Print Bills from Phone | Billo",
    description: "Print bills from your phone on any 58mm or 80mm Bluetooth thermal printer. Billo prints instantly — no PDF, no print dialog. Printer bill formats with logo. From ₹299.",
    h1: "Print bills on a thermal printer, straight from your phone",
    intro: "Billo sends the bill directly to your Bluetooth thermal printer in about a second — short, clean bills with your logo and a bold total.",
    points: [
      { title: "58mm & 80mm printers", text: "Works with most Bluetooth (BLE) thermal receipt printers." },
      { title: "Bill formats with logo", text: "Classic, Quick Token, GST, Paper Saver and Logo Bill — with live preview." },
      { title: "One-tap reprint", text: "Reprint any old bill from the Bills page in one tap." },
      { title: "Tested printer available", text: "Buy the Billo Counter Kit and get a printer that's already tested and set up." },
    ],
    keywords: ["thermal printer", "thermal printer billing", "bluetooth thermal printer", "printer bill", "bill printing", "printing bill", "bill print", "bill prints", "bill printing machine", "receipt printer"],
    image: "/food-library/coffee.jpg",
  },
  {
    slug: "token-printing-software",
    name: "Token printing",
    eyebrow: "Token print",
    waText: "Hi Billo, I want token printing for my counter.",
    title: "Token Printing Software – Print Token Numbers on Bills | Billo",
    description: "Token print on every bill: big daily token numbers for tiffin centres, fast food and canteens. Billo prints token + bill on a thermal printer from your phone.",
    h1: "Token printing that keeps the rush moving",
    intro: "Every bill prints a big token number. The customer hands it to the kitchen — no shouting, no confusion, no extra software.",
    points: [
      { title: "Huge token numbers", text: "Large or normal size token printed at the top of the bill." },
      { title: "Resets every day", text: "Token numbers start from 1 each morning automatically." },
      { title: "Kitchen slip option", text: "Print a separate kitchen token slip after the customer bill." },
      { title: "Works for canteens", text: "Ideal for tiffin centres, fast food, juice shops and canteens." },
    ],
    keywords: ["token print", "token printing", "token printer", "token billing", "token number printing", "token system for restaurant"],
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
