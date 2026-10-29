/**
 * Words printed on the bill, per language. Shop-typed text (shop name, item names,
 * header/footer) prints exactly as typed — in any script.
 */
export type BillLanguage = "en" | "hi" | "te" | "ta" | "kn" | "ml" | "mr" | "bn" | "gu" | "pa";

export interface BillLabels {
  bill: string;
  token: string;
  item: string;
  qty: string;
  rate: string;
  amount: string;
  subtotal: string;
  discount: string;
  total: string;
  paidBy: string;
  cashier: string;
  customer: string;
  dineIn: string;
  takeaway: string;
  kitchen: string;
  thankYou: string;
  methods: Record<string, string>;
}

export const BILL_LANGUAGES: { id: BillLanguage; name: string }[] = [
  { id: "en", name: "English" },
  { id: "te", name: "తెలుగు" },
  { id: "hi", name: "हिन्दी" },
  { id: "ta", name: "தமிழ்" },
  { id: "kn", name: "ಕನ್ನಡ" },
  { id: "ml", name: "മലയാളം" },
  { id: "mr", name: "मराठी" },
  { id: "bn", name: "বাংলা" },
  { id: "gu", name: "ગુજરાતી" },
  { id: "pa", name: "ਪੰਜਾਬੀ" },
];

const L: Record<BillLanguage, BillLabels> = {
  en: {
    bill: "Bill", token: "TOKEN", item: "Item", qty: "Qty", rate: "Rate", amount: "Amount", subtotal: "Subtotal",
    discount: "Discount", total: "TOTAL", paidBy: "Paid by", cashier: "Cashier", customer: "Customer",
    dineIn: "Dine-in", takeaway: "Takeaway", kitchen: "KITCHEN", thankYou: "Thank you, visit again!",
    methods: { CASH: "CASH", UPI: "UPI", CARD: "CARD", CREDIT: "CREDIT" },
  },
  hi: {
    bill: "बिल", token: "टोकन", item: "आइटम", qty: "मात्रा", rate: "दर", amount: "राशि", subtotal: "उप-योग",
    discount: "छूट", total: "कुल", paidBy: "भुगतान", cashier: "कैशियर", customer: "ग्राहक",
    dineIn: "यहीं खाएं", takeaway: "पार्सल", kitchen: "किचन", thankYou: "धन्यवाद, फिर पधारें!",
    methods: { CASH: "नकद", UPI: "UPI", CARD: "कार्ड", CREDIT: "उधार" },
  },
  te: {
    bill: "బిల్", token: "టోకెన్", item: "ఐటమ్", qty: "సంఖ్య", rate: "ధర", amount: "మొత్తం", subtotal: "ఉప మొత్తం",
    discount: "తగ్గింపు", total: "మొత్తం", paidBy: "చెల్లింపు", cashier: "క్యాషియర్", customer: "కస్టమర్",
    dineIn: "ఇక్కడే", takeaway: "పార్సిల్", kitchen: "కిచెన్", thankYou: "ధన్యవాదాలు, మళ్ళీ రండి!",
    methods: { CASH: "నగదు", UPI: "UPI", CARD: "కార్డ్", CREDIT: "అప్పు" },
  },
  ta: {
    bill: "பில்", token: "டோக்கன்", item: "பொருள்", qty: "அளவு", rate: "விலை", amount: "தொகை", subtotal: "துணைத் தொகை",
    discount: "தள்ளுபடி", total: "மொத்தம்", paidBy: "செலுத்தியது", cashier: "காசாளர்", customer: "வாடிக்கையாளர்",
    dineIn: "இங்கே", takeaway: "பார்சல்", kitchen: "சமையலறை", thankYou: "நன்றி, மீண்டும் வருக!",
    methods: { CASH: "ரொக்கம்", UPI: "UPI", CARD: "கார்டு", CREDIT: "கடன்" },
  },
  kn: {
    bill: "ಬಿಲ್", token: "ಟೋಕನ್", item: "ಐಟಂ", qty: "ಪ್ರಮಾಣ", rate: "ದರ", amount: "ಮೊತ್ತ", subtotal: "ಉಪ ಮೊತ್ತ",
    discount: "ರಿಯಾಯಿತಿ", total: "ಒಟ್ಟು", paidBy: "ಪಾವತಿ", cashier: "ಕ್ಯಾಷಿಯರ್", customer: "ಗ್ರಾಹಕ",
    dineIn: "ಇಲ್ಲೇ", takeaway: "ಪಾರ್ಸೆಲ್", kitchen: "ಅಡುಗೆಮನೆ", thankYou: "ಧನ್ಯವಾದಗಳು, ಮತ್ತೆ ಬನ್ನಿ!",
    methods: { CASH: "ನಗದು", UPI: "UPI", CARD: "ಕಾರ್ಡ್", CREDIT: "ಸಾಲ" },
  },
  ml: {
    bill: "ബിൽ", token: "ടോക്കൺ", item: "ഇനം", qty: "എണ്ണം", rate: "നിരക്ക്", amount: "തുക", subtotal: "ഉപതുക",
    discount: "കിഴിവ്", total: "ആകെ", paidBy: "അടച്ചത്", cashier: "കാഷ്യർ", customer: "ഉപഭോക്താവ്",
    dineIn: "ഇവിടെ", takeaway: "പാർസൽ", kitchen: "അടുക്കള", thankYou: "നന്ദി, വീണ്ടും വരിക!",
    methods: { CASH: "പണം", UPI: "UPI", CARD: "കാർഡ്", CREDIT: "കടം" },
  },
  mr: {
    bill: "बिल", token: "टोकन", item: "वस्तू", qty: "नग", rate: "दर", amount: "रक्कम", subtotal: "उप-एकूण",
    discount: "सूट", total: "एकूण", paidBy: "भरणा", cashier: "कॅशियर", customer: "ग्राहक",
    dineIn: "इथे", takeaway: "पार्सल", kitchen: "किचन", thankYou: "धन्यवाद, पुन्हा भेट द्या!",
    methods: { CASH: "रोख", UPI: "UPI", CARD: "कार्ड", CREDIT: "उधार" },
  },
  bn: {
    bill: "বিল", token: "টোকেন", item: "আইটেম", qty: "পরিমাণ", rate: "দর", amount: "টাকা", subtotal: "উপমোট",
    discount: "ছাড়", total: "মোট", paidBy: "পরিশোধ", cashier: "ক্যাশিয়ার", customer: "গ্রাহক",
    dineIn: "এখানে", takeaway: "পার্সেল", kitchen: "রান্নাঘর", thankYou: "ধন্যবাদ, আবার আসবেন!",
    methods: { CASH: "নগদ", UPI: "UPI", CARD: "কার্ড", CREDIT: "ধার" },
  },
  gu: {
    bill: "બિલ", token: "ટોકન", item: "વસ્તુ", qty: "નંગ", rate: "ભાવ", amount: "રકમ", subtotal: "પેટા કુલ",
    discount: "છૂટ", total: "કુલ", paidBy: "ચુકવણી", cashier: "કેશિયર", customer: "ગ્રાહક",
    dineIn: "અહીં", takeaway: "પાર્સલ", kitchen: "રસોડું", thankYou: "આભાર, ફરી પધારજો!",
    methods: { CASH: "રોકડ", UPI: "UPI", CARD: "કાર્ડ", CREDIT: "ઉધાર" },
  },
  pa: {
    bill: "ਬਿੱਲ", token: "ਟੋਕਨ", item: "ਆਈਟਮ", qty: "ਮਾਤਰਾ", rate: "ਰੇਟ", amount: "ਰਕਮ", subtotal: "ਉਪ-ਜੋੜ",
    discount: "ਛੋਟ", total: "ਕੁੱਲ", paidBy: "ਭੁਗਤਾਨ", cashier: "ਕੈਸ਼ੀਅਰ", customer: "ਗਾਹਕ",
    dineIn: "ਇੱਥੇ", takeaway: "ਪਾਰਸਲ", kitchen: "ਰਸੋਈ", thankYou: "ਧੰਨਵਾਦ, ਫਿਰ ਆਇਓ!",
    methods: { CASH: "ਨਕਦ", UPI: "UPI", CARD: "ਕਾਰਡ", CREDIT: "ਉਧਾਰ" },
  },
};

export function billLabels(lang: string | undefined): BillLabels {
  return L[(lang as BillLanguage) in L ? (lang as BillLanguage) : "en"];
}
