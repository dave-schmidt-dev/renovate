const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function buildPrompt(inventory) {
  return `
Return strict JSON only.
Given inventory items with expiresInDays, generate exactly 3 recipes that prioritize low expiresInDays first.
For each recipe provide:
- recipeName
- usesItems (array)
- missingItems (array)
- steps (array of 3-5 concise steps)

Then provide routeDecisions for each inventory item with:
- item
- route (eat|donate|compost|failure)
- reason

Inventory:
${JSON.stringify(inventory, null, 2)}
`;
}

function heuristicPlan(inventory) {
  const sorted = [...inventory].sort((a, b) => a.expiresInDays - b.expiresInDays);
  const urgent = sorted.slice(0, 5).map((i) => i.canonicalName);

  const adjectives = ["Fresh", "Hearty", "Savory", "Rustic", "Crispy", "Zesty", "Creamy", "Golden"];
  const skilletAdj = adjectives[0];
  const bowlAdj = adjectives[2];
  const soupAdj = adjectives[1];

  function titleCase(name) {
    if (!name) return "";
    return name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function skilletName() {
    const a = titleCase(urgent[0]) || "Vegetable";
    const b = urgent[1] ? ` & ${titleCase(urgent[1])}` : "";
    return `${skilletAdj} ${a}${b} Skillet`;
  }

  function bowlName() {
    const a = titleCase(urgent[1]) || "Grain";
    const b = urgent[2] ? ` & ${titleCase(urgent[2])}` : "";
    return `${bowlAdj} ${a}${b} Bowl`;
  }

  function soupName() {
    const a = titleCase(urgent[2]) || "Garden Vegetable";
    const b = urgent[3] ? ` & ${titleCase(urgent[3])}` : "";
    return `${soupAdj} ${a}${b} Soup`;
  }

  const recipes = [
    {
      recipeName: skilletName(),
      usesItems: urgent.slice(0, 3),
      missingItems: ["olive oil", "garlic", "salt"],
      steps: [
        "Wash and roughly chop the fresh produce.",
        "Heat oil in a skillet and cook ingredients over medium-high heat until tender.",
        "Season to taste and serve hot.",
      ],
    },
    {
      recipeName: bowlName(),
      usesItems: urgent.slice(1, 4),
      missingItems: ["rice", "lemon"],
      steps: [
        "Cook your grain base according to package directions.",
        "Prepare the remaining ingredients and layer over the grain.",
        "Finish with a squeeze of lemon and your preferred seasoning.",
      ],
    },
    {
      recipeName: soupName(),
      usesItems: urgent.slice(2, 5),
      missingItems: ["broth", "onion"],
      steps: [
        "Dice the vegetables and sauté with onion until softened.",
        "Add broth and simmer until ingredients are cooked through and flavors meld.",
        "Adjust seasoning, ladle into bowls, and refrigerate any leftovers.",
      ],
    },
  ];

  const routeDecisions = inventory.map((item) => {
    if (urgent.includes(item.canonicalName)) {
      return { item: item.canonicalName, route: "eat", reason: "Used in urgent recipe set." };
    }
    if (item.expiresInDays <= 3) {
      return { item: item.canonicalName, route: "donate", reason: "High urgency; unlikely to cook in time." };
    }
    if (item.expiresInDays <= 7) {
      return { item: item.canonicalName, route: "compost", reason: "Not selected; compost recommended." };
    }
    return { item: item.canonicalName, route: "eat", reason: "Stable shelf window." };
  });

  return { recipes, routeDecisions };
}

function safeParseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callOpenRouter(prompt, key) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
      "HTTP-Referer": "https://leftover-lens.app",
      "X-Title": "Leftover Lens",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.choices?.[0]?.message?.content || "";
  return safeParseJson(text);
}

const OCR_PROMPT = `You are a receipt parser. Extract ONLY the food/grocery items from this receipt image.
Return ONLY a JSON array of items. No prose. No markdown. No code fences. Example:
[{"name":"Bananas Organic","qty":6,"unit":"ct"},{"name":"Milk 2%","qty":1,"unit":"gal"}]
Ignore totals, tax, payment info, store name, date. Only food items.`;

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function ocrReceipt(imageBase64, mediaType, apiKey) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "HTTP-Referer": "https://leftover-lens.app",
      "X-Title": "Leftover Lens",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: OCR_PROMPT },
          { type: "image_url", image_url: { url: "data:" + (mediaType || "image/jpeg") + ";base64," + imageBase64 } },
        ],
      }],
      temperature: 0.1,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = data.choices?.[0]?.message?.content || "";

  // Strip markdown fences if present, then parse JSON
  const stripped = text.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // Try to find [...] in the text
    const match = stripped.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error("OCR response could not be parsed as a JSON array.");
  }
}

export async function generatePlanWithFallback(inventory, settings) {
  const prompt = buildPrompt(inventory);

  if (settings.mockMode) {
    return { ...heuristicPlan(inventory), provider: "mock" };
  }

  if (settings.openrouterKey) {
    try {
      const result = await callOpenRouter(prompt, settings.openrouterKey);
      if (result?.recipes && result?.routeDecisions) return { ...result, provider: "openrouter" };
    } catch {
      // fall through to heuristic
    }
  }

  return { ...heuristicPlan(inventory), provider: "heuristic-fallback" };
}
