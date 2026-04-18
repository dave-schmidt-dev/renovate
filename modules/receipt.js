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
  bananas: 2,
  milk: 4,
  spinach: 2,
  "chicken breast": 2,
  yogurt: 5,
  bread: 4,
  strawberries: 2,
  "brown rice": 45,
  tofu: 6,
  "canned tomato": 180,
  onion: 14,
  "romaine lettuce": 4,
  apple: 14,
  eggs: 21,
  "oat milk": 9,
  carrot: 12,
  potato: 20,
  avocado: 3,
};

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
    const expiresInDays = (item.expiresInDays > 0 ? item.expiresInDays : null) ?? DEFAULT_EXPIRY[canonical] ?? 5;
    return {
      id: `${canonical}-${now}-${idx}`,
      canonicalName: canonical,
      rawLabel: item.rawLabel,
      quantity: Number(item.estimatedQuantity || 1),
      unit: "unit",
      expiresInDays,
      confidence: Number(item.confidenceScore || 0),
    };
  });
}
