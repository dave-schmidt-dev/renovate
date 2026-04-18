# Parsly

Receipt-to-recipe sustainability assistant for the NVCC Renovate hackathon.

**Live demo**: https://dave-schmidt-dev.github.io/renovate/

## What It Does

- Scans receipt photos with AI vision (OpenRouter GPT-4o-mini) to extract grocery items
- Learns short receipt aliases (example: `MLK 2%` -> `milk`) for future scans
- Tracks real expiration dates using USDA FoodKeeper database (587 items, 1217 keywords)
- Generates recipes that prioritize foods closest to spoilage
- Routes items: eat (use in recipes) -> donate (local Manassas food pantries) -> compost -> failure
- Sends shopping lists via email (EmailJS integration)
- Tracks sustainability metrics: items at risk, items rescued, failure count

## Quick Start

1. Open https://dave-schmidt-dev.github.io/renovate/ or serve locally:
   ```
   python3 -m http.server 4173
   ```
2. Enter your OpenRouter API key in Settings (get one at openrouter.ai)
3. Upload a receipt photo and click **Scan Receipt**, or click **Load Demo & Go**
4. Review detected items, adjust names/expiry if needed, click **Confirm & Import**
5. Click **Generate Recipes** for AI-powered meal suggestions and food routing

## AI Provider

Uses OpenRouter (GPT-4o-mini) for:
- Receipt image OCR (vision API)
- Recipe generation + sustainability routing

Falls back to local heuristic when no API key is set. Mock mode available via toggle.

## File Structure

```
index.html              — Single-page app with M3 design system
styles.css              — CSS custom properties + Tailwind CDN fallback
app.js                  — Main controller, DOM rendering, event wiring
logo.png                — Parsly logo
modules/
  storage.js            — localStorage persistence (aliases, inventory, settings)
  demoData.js           — Demo receipt scenarios + Manassas donation/compost locations
  receipt.js            — Receipt parsing, alias matching, expiry estimation
  ai.js                 — OpenRouter API (vision OCR + recipe generation)
  planner.js            — Shopping suggestions + risk summary
  routing.js            — Eat/donate/compost/failure routing logic
  foodkeeper.js         — USDA FoodKeeper database (587 items, 1217 keywords)
stitch templates/       — Original Google Stitch UI design references
```

## Data Sources

- **USDA FoodKeeper** (FSIS via data.gov) — authoritative food shelf life data
- **Food waste stats**: USDA, ReFED, UNEP Food Waste Index 2024
- **Donation locations**: Real food pantries near Manassas, VA (ACTS, House of Mercy, Sacred Heart, NVFS, Bull Run UU)

## Design

Material Design 3 color system from Google Stitch templates:

- M3 color palette (primary green `#3d653e`, error red `#ba1a1a`)
- Manrope (headlines) + Inter (body) fonts, Material Symbols icons
- Sticky side navigation with scroll-tracking highlights
- Risk color coding: red (<=3 days), amber (4-7 days), green (>7 days)
- Confidence labels: Known Alias, AI Matched, Best Guess, Needs Review
- CSS custom property fallback for offline use

## Team

- Ali: frontend screens and UX flow
- Steve: AI/data pipeline and provider fallback logic
- Dave: sustainability routing, metrics, and demo flow

## License

MIT
