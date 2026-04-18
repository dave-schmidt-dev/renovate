<p align="center">
  <img src="logo_nobg.png" alt="Parsly" width="200">
</p>

<h3 align="center">Stop wasting food. Start cooking smarter.</h3>

<p align="center">
  <a href="https://dave-schmidt-dev.github.io/renovate/">Live Demo</a>
</p>

---

40% of the food supply in the United States is wasted, most of it in our own kitchens. Parsley scans your grocery receipts, tracks what's about to expire, and generates recipes that use your most perishable items first. Anything you can't eat gets routed to local food pantries or compost, nothing goes to waste.

Built for the [NVCC Renovate Hackathon](https://www.nvcc.edu/renovate/) (Spring 2026).

## How It Works

1. **Scan** — Upload a receipt photo or paste receipt text. AI vision extracts your grocery items.
2. **Track** — Each item gets a real expiration date from the USDA FoodKeeper database (587 foods, 1217 keywords). Parsly learns your receipt shorthand (`MLK 2%` = `milk`) for future scans.
3. **Cook** — Generate recipes that prioritize foods closest to spoilage. Red = expiring soon, amber = use this week, green = fresh.
4. **Route** — Items you can't cook get routed: donate to nearby food pantries, or compost. Mark items as eaten, donated, or composted to track your impact.

## Quick Start

**Try the demo** (no setup required):
1. Open the [live site](https://dave-schmidt-dev.github.io/renovate/)
2. Click **Load Demo & Go** — walks through a full scenario automatically

**Use with real receipts:**
1. Get a free API key from [openrouter.ai](https://openrouter.ai)
2. Enter it in Settings
3. Upload a receipt photo or paste receipt text
4. Review items, then **Confirm & Import**
5. Click **Generate Recipes**

To run locally: `python3 -m http.server 4173`

## Tech Stack

- **Frontend**: Vanilla JS, Tailwind CSS (CDN), Material Design 3 color system
- **AI**: OpenRouter (GPT-4o-mini) for receipt OCR and recipe generation
- **Data**: USDA FoodKeeper database for shelf life, hand-tuned overrides for common items
- **Storage**: localStorage (no backend, no accounts)
- **Hosting**: GitHub Pages

Falls back to local heuristics when no API key is set. Mock mode available for offline demos.

## Project Structure

```
index.html              — Single-page app (M3 design system)
styles.css              — CSS custom properties + Tailwind CDN fallback
app.js                  — Controller, DOM rendering, event wiring
modules/
  receipt.js            — Receipt parsing, alias matching, expiry estimation
  ai.js                 — OpenRouter API (vision OCR + recipe generation)
  foodkeeper.js         — USDA FoodKeeper database (587 items, 1217 keywords)
  routing.js            — Eat / donate / compost / failure routing logic
  planner.js            — Shopping suggestions + risk summary
  storage.js            — localStorage persistence (aliases, inventory, settings)
  demoData.js           — Demo receipts + Manassas donation/compost locations
```

## Data Sources

- **[USDA FoodKeeper](https://www.fsis.usda.gov/science-data/research-projects/food-keeper-data)** — authoritative food shelf life data (FSIS via data.gov)
- **Food waste statistics** — USDA, ReFED, UNEP Food Waste Index 2024
- **Donation locations** — Real food pantries near Manassas, VA (ACTS, House of Mercy, Sacred Heart, NVFS, Bull Run UU)

## Team

| Name | Focus |
|------|-------|
| **Ali** ([@Valiyev-Ali](https://github.com/Valiyev-Ali)) | Frontend screens and UX flow |
| **Steve** ([@steveonw](https://github.com/steveonw)) | AI/data pipeline and provider fallback logic |
| **Dave** ([@dave-schmidt-dev](https://github.com/dave-schmidt-dev)) | Sustainability routing, metrics, and demo flow |

## License

[MIT](LICENSE)
