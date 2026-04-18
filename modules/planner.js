export function buildShoppingSuggestions(recipes) {
  const map = new Map();
  recipes.forEach((recipe) => {
    (recipe.missingItems || []).forEach((item) => {
      const key = item.toLowerCase();
      const current = map.get(key) ?? { name: key, recipes: [], required: true };
      current.recipes.push(recipe.recipeName);
      map.set(key, current);
    });
  });
  return [...map.values()];
}

export function summarizeRisk(inventory) {
  const highRisk = inventory.filter((item) => {
    if (item.expiresAt) {
      const ms = new Date(item.expiresAt).getTime() - Date.now();
      return Math.ceil(ms / 86400000) <= 3;
    }
    return (item.expiresInDays ?? item.shelfLifeDays ?? 14) <= 3;
  }).length;
  return {
    total: inventory.length,
    highRisk,
  };
}
