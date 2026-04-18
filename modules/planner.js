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
  const highRisk = inventory.filter((item) => item.expiresInDays <= 3).length;
  return {
    total: inventory.length,
    highRisk,
  };
}
