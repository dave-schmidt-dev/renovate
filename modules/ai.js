const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const OPENAI_URL = "https://api.openai.com/v1/responses";

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

async function callGemini(prompt, key) {
  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error("Gemini request failed");
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return safeParseJson(text);
}

async function callOpenAI(prompt, key) {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "json_object" } },
    }),
  });
  if (!res.ok) throw new Error("OpenAI request failed");
  const json = await res.json();
  const text = json?.output?.[0]?.content?.[0]?.text ?? "";
  return safeParseJson(text);
}

export async function generatePlanWithFallback(inventory, settings) {
  const prompt = buildPrompt(inventory);

  if (settings.mockMode) {
    return { ...heuristicPlan(inventory), provider: "mock" };
  }

  if (settings.geminiKey) {
    try {
      const result = await callGemini(prompt, settings.geminiKey);
      if (result?.recipes && result?.routeDecisions) return { ...result, provider: "gemini" };
    } catch {
      // continue to next provider
    }
  }

  if (settings.openaiKey) {
    try {
      const result = await callOpenAI(prompt, settings.openaiKey);
      if (result?.recipes && result?.routeDecisions) return { ...result, provider: "openai" };
    } catch {
      // continue to fallback
    }
  }

  return { ...heuristicPlan(inventory), provider: "heuristic-fallback" };
}
