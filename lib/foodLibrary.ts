/**
 * Billo's built-in food photo library (public/food-library/*.jpg, 640×400).
 * Shown in "Choose existing" for every business, and auto-suggested when a
 * product name matches — so most menus need zero photo uploads.
 */

export interface LibraryImage {
  imageUrl: string;
  name: string;
  keywords: string[];
}

const RAW: [slug: string, name: string, keywords: string[]][] = [
  ["idli", "Idli", ["idli", "idly", "iddli"]],
  ["dosa", "Dosa", ["dosa", "dosai", "masala dosa", "plain dosa", "set dosa", "rava dosa"]],
  ["vada", "Vada", ["vada", "vadai", "medu vada", "wada"]],
  ["uthappam", "Uthappam", ["uthappam", "uttapam", "uthapam", "oothappam"]],
  ["poori", "Poori", ["poori", "puri", "pori"]],
  ["mysore-bonda", "Mysore Bonda", ["bonda", "mysore bonda", "goli baje"]],
  ["meals", "Meals", ["meals", "thali", "full meals", "south indian meals", "lunch"]],
  ["dal-rice", "Dal Rice", ["dal rice", "dal", "pappu", "sambar rice", "dal chawal"]],
  ["curd-rice", "Curd Rice", ["curd rice", "thayir sadam", "daddojanam"]],
  ["lemon-rice", "Lemon Rice", ["lemon rice", "chitranna", "pulihora"]],
  ["tomato-rice", "Tomato Rice", ["tomato rice", "tomato bath"]],
  ["jeera-rice", "Jeera Rice", ["jeera rice", "jira rice", "plain rice", "steamed rice"]],
  ["veg-biryani", "Veg Biryani", ["veg biryani", "veg biriyani", "vegetable biryani", "pulao", "veg pulao"]],
  ["chicken-biryani", "Chicken Biryani", ["chicken biryani", "chicken biriyani", "biryani", "biriyani"]],
  ["mutton-biryani", "Mutton Biryani", ["mutton biryani", "mutton biriyani", "gosht biryani"]],
  ["egg-fried-rice", "Egg Fried Rice", ["egg fried rice", "egg rice"]],
  ["chicken-fried-rice", "Chicken Fried Rice", ["chicken fried rice", "fried rice"]],
  ["veg-noodles", "Veg Noodles", ["veg noodles", "noodles", "hakka noodles", "veg noddles"]],
  ["egg-noodles", "Egg Noodles", ["egg noodles", "egg noddles"]],
  ["veg-manchurian", "Veg Manchurian", ["manchurian", "manchuria", "gobi manchurian", "veg manchurian"]],
  ["tea", "Tea", ["tea", "chai", "masala tea", "masala chai", "milk tea"]],
  ["ginger-tea", "Ginger Tea", ["ginger tea", "ginger chai", "adrak chai", "adrak tea", "allam tea"]],
  ["lemon-tea", "Lemon Tea", ["lemon tea", "black tea", "iced tea"]],
  ["coffee", "Coffee", ["coffee", "filter coffee", "kaapi", "cappuccino", "latte"]],
  ["milk", "Milk", ["milk", "badam milk", "hot milk"]],
  ["curd", "Curd", ["curd", "dahi", "raita", "yogurt", "buttermilk", "lassi"]],
  ["milk-sweets", "Milk Sweets", ["sweet", "sweets", "rasgulla", "rasmalai", "peda", "milk sweet"]],
];

export const FOOD_LIBRARY: LibraryImage[] = RAW.map(([slug, name, keywords]) => ({
  imageUrl: `/food-library/${slug}.jpg`,
  name,
  keywords,
}));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();

/** Best library photo for a product name (longest keyword wins, so "Egg Fried Rice" beats "Fried Rice"). */
export function suggestLibraryImage(productName: string): LibraryImage | null {
  const n = ` ${norm(productName)} `;
  if (n.trim().length < 2) return null;
  let best: { img: LibraryImage; len: number } | null = null;
  for (const img of FOOD_LIBRARY) {
    for (const k of img.keywords) {
      if (n.includes(` ${k} `) && (!best || k.length > best.len)) best = { img, len: k.length };
    }
  }
  return best?.img ?? null;
}
