import { USDA_SHELF_LIFE } from "./foodkeeper.js";

const FOOD_HINTS = {
  BNNS: "bananas",
  MLK: "milk",
  SPNCH: "spinach",
  CHK: "chicken breast",
  BRST: "chicken breast",
  YGRT: "yogurt",
  BREAD: "bread",
  STRWBRY: "strawberries",
  RICE: "brown rice",
  TOFU: "tofu",
  TMTA: "canned tomato",
  ONION: "onion",
  LETTUCE: "romaine lettuce",
  APPLES: "apple",
  EGGS: "eggs",
  OAT: "oat milk",
  CARROT: "carrot",
  POTATO: "potato",
  AVOC: "avocado",
};

const DEFAULT_EXPIRY = {
  // Produce — leafy / herbs
  bananas: 2,
  spinach: 2,
  lettuce: 4,
  "romaine lettuce": 4,
  kale: 3,
  broccoli: 5,
  celery: 14,
  cucumber: 7,
  "bell pepper": 7,
  corn: 3,
  mushroom: 5,
  zucchini: 5,
  // Produce — fruit
  strawberries: 2,
  blueberries: 3,
  grapes: 7,
  orange: 14,
  lemon: 21,
  lime: 21,
  mango: 5,
  pineapple: 5,
  watermelon: 5,
  peach: 4,
  pear: 5,
  apple: 14,
  avocado: 3,
  // Produce — root / sturdy
  onion: 14,
  carrot: 12,
  potato: 20,
  // Dairy
  milk: 4,
  "oat milk": 9,
  yogurt: 5,
  butter: 30,
  "cream cheese": 14,
  "sour cream": 14,
  "heavy cream": 7,
  "cottage cheese": 7,
  cheddar: 30,
  mozzarella: 7,
  eggs: 21,
  // Meat & seafood
  "chicken breast": 2,
  "ground beef": 2,
  steak: 3,
  "pork chop": 3,
  salmon: 2,
  shrimp: 2,
  turkey: 3,
  bacon: 7,
  ham: 5,
  sausage: 3,
  // Bread & bakery
  bread: 4,
  tortilla: 14,
  bagel: 5,
  muffin: 3,
  croissant: 2,
  // Pantry — dry staples
  "brown rice": 365,
  pasta: 365,
  flour: 365,
  sugar: 730,
  oats: 365,
  cereal: 90,
  granola: 90,
  // Pantry — canned / jarred
  "canned tomato": 180,
  "canned beans": 365,
  "canned soup": 365,
  "canned tuna": 365,
  // Pantry — condiments / oils
  "peanut butter": 180,
  jam: 180,
  honey: 730,
  "maple syrup": 365,
  "olive oil": 365,
  ketchup: 180,
  mustard: 365,
  mayo: 60,
  "soy sauce": 365,
  "hot sauce": 365,
  // Snacks & sweets
  chips: 60,
  crackers: 90,
  cookies: 30,
  chocolate: 180,
  candy: 180,
  licorice: 180,
  gummy: 180,
  popcorn: 60,
  // Beverages
  juice: 7,
  soda: 180,
  coffee: 90,
  tea: 365,
  // Deli / prepared
  hummus: 7,
  salsa: 14,
  guacamole: 3,
  "deli meat": 5,
  "hot dog": 14,
  // Frozen
  "frozen pizza": 365,
  "frozen vegetables": 365,
  "ice cream": 120,
  "frozen fruit": 365,
  // Soy / alternative proteins
  tofu: 6,
};

const CATEGORY_KEYWORDS = [
  { pattern: /frozen/i, days: 365 },
  { pattern: /canned|can of/i, days: 365 },
  { pattern: /dried|dry|dehydrated/i, days: 365 },
  { pattern: /rice|pasta|grain|quinoa|couscous|barley/i, days: 365 },
  { pattern: /flour|sugar|baking/i, days: 365 },
  { pattern: /oil|vinegar/i, days: 365 },
  { pattern: /tea|coffee/i, days: 90 },
  { pattern: /candy|chocolate|gummy|licorice|sweets/i, days: 180 },
  { pattern: /chips|crackers|pretzel|popcorn|snack/i, days: 60 },
  { pattern: /nut|seed|almond|walnut|cashew|pistachio/i, days: 180 },
  { pattern: /peanut butter|jam|jelly|honey|syrup|sauce|condiment|ketchup|mustard/i, days: 180 },
  { pattern: /cereal|granola|oat/i, days: 90 },
  { pattern: /cookie|brownie|cake mix/i, days: 30 },
  { pattern: /soda|pop|sparkling/i, days: 180 },
  { pattern: /butter|margarine/i, days: 30 },
  { pattern: /cheese/i, days: 14 },
  { pattern: /yogurt/i, days: 14 },
  { pattern: /milk|cream/i, days: 7 },
  { pattern: /egg/i, days: 28 },
  { pattern: /juice/i, days: 7 },
  { pattern: /bread|bagel|roll|bun|tortilla|pita|wrap/i, days: 5 },
  { pattern: /deli|lunch meat|cold cut/i, days: 5 },
  { pattern: /hummus|dip|salsa|guac/i, days: 7 },
  { pattern: /chicken|turkey|poultry/i, days: 3 },
  { pattern: /beef|steak|ground|pork|lamb|veal/i, days: 3 },
  { pattern: /fish|salmon|tuna|shrimp|seafood|crab|lobster/i, days: 2 },
  { pattern: /bacon|sausage|ham|hot dog/i, days: 7 },
  { pattern: /berry|berries|strawberry|blueberry|raspberry/i, days: 3 },
  { pattern: /lettuce|spinach|kale|arugula|greens|herb|cilantro|parsley|basil/i, days: 3 },
  { pattern: /banana|avocado|peach|plum|nectarine|mango/i, days: 4 },
  { pattern: /tomato|pepper|cucumber|zucchini|squash|mushroom/i, days: 5 },
  { pattern: /apple|pear|orange|lemon|lime|grapefruit|citrus/i, days: 14 },
  { pattern: /carrot|potato|onion|garlic|beet|turnip|radish|celery/i, days: 14 },
];

export function guessExpiry(name) {
  const n = String(name).trim().toLowerCase();
  // 1. Specific match
  if (DEFAULT_EXPIRY[n] !== undefined) return DEFAULT_EXPIRY[n];
  // 2. Partial specific match
  for (const [food, days] of Object.entries(DEFAULT_EXPIRY)) {
    if (n.includes(food)) return days;
  }
  // 3. Category keyword match
  for (const { pattern, days } of CATEGORY_KEYWORDS) {
    if (pattern.test(n)) return days;
  }
  // 4. USDA FoodKeeper database (1217 keywords, 587 items)
  const words = n.split(/[\s,\-\/]+/);
  for (const word of words) {
    if (word.length > 2 && USDA_SHELF_LIFE[word] !== undefined) return USDA_SHELF_LIFE[word];
  }
  // Also try multi-word matches
  if (USDA_SHELF_LIFE[n] !== undefined) return USDA_SHELF_LIFE[n];
  // 5. Conservative default
  return 14;
}

export function parseReceiptText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((rawLine) => {
      const rawLabel = rawLine.replace(/\$?\d+([.]\d+)?/g, "").trim();
      return {
        rawLabel,
        confidenceScore: 0,
        canonicalFoodName: "",
        estimatedQuantity: 1,
      };
    });
}

export function enrichWithAlias(receiptItems, aliasMap) {
  return receiptItems.map((item) => {
    const token = item.rawLabel.toUpperCase();
    const known = aliasMap[token];
    if (known) {
      return {
        ...item,
        canonicalFoodName: known,
        confidenceScore: 0.99,
      };
    }

    const guess = findGuess(token);
    return {
      ...item,
      canonicalFoodName: guess.name,
      confidenceScore: guess.confidence,
    };
  });
}

function findGuess(raw) {
  const parts = raw.split(/\s+/);
  for (const part of parts) {
    if (FOOD_HINTS[part]) {
      return { name: FOOD_HINTS[part], confidence: 0.75 };
    }
  }
  return { name: raw.toLowerCase(), confidence: 0.35 };
}

export function toInventoryItems(reviewedItems) {
  const now = Date.now();
  return reviewedItems.map((item, idx) => {
    const canonical = item.canonicalFoodName.trim().toLowerCase();
    const expiresInDays = (item.expiresInDays > 0 ? item.expiresInDays : null) ?? guessExpiry(canonical);
    return {
      id: `${canonical}-${now}-${idx}`,
      canonicalName: canonical,
      rawLabel: item.rawLabel,
      quantity: Number(item.estimatedQuantity || 1),
      unit: "unit",
      shelfLifeDays: expiresInDays,
      expiresAt: new Date(now + expiresInDays * 86400000).toISOString(),
      importedAt: new Date(now).toISOString(),
      confidence: Number(item.confidenceScore || 0),
    };
  });
}

export function daysLeft(item) {
  if (!item.expiresAt) return item.expiresInDays ?? item.shelfLifeDays ?? 14;
  const ms = new Date(item.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}
