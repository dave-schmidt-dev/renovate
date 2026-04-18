# Leftover Lens

Receipt-to-recipe sustainability assistant for the NVCC Renovate hackathon.

## What It Does

- Bulk-imports groceries from receipt text/file input
- Learns short receipt aliases (example: `MLK 2%` -> `milk`) for future scans
- Generates recipes that prioritize foods closest to spoilage
- Builds suggested shopping items for missing recipe ingredients
- Routes leftovers using policy: `eat -> donate -> compost -> failure`
- Tracks `failure` count as a primary sustainability metric

## Quick Start

1. From this folder, run:
   ```
   python3 -m http.server 4173
   ```
2. Open `http://localhost:4173`
3. Click **Load Demo & Go** for the full automated demo, or:
   - Click **Load Demo Scenario** to paste receipt lines
   - Click **Scan Receipt**, review aliases, then **Confirm & Import**
   - Click **Generate Recipes** to see recipes, shopping list, and routing

## AI Provider Order

The app has a fallback chain for recipe generation:

1. **Gemini Flash** (primary live provider — needs API key)
2. **OpenAI mini** (backup — needs API key)
3. **Mock mode heuristic** (default — works fully offline)

Mock Mode is on by default so the demo always works without API keys.

## File Structure

```
index.html          — Single-page app with M3 design system
styles.css          — CSS custom properties + Tailwind CDN fallback
app.js              — Main controller, DOM rendering, event wiring
modules/
  storage.js        — localStorage persistence (aliases, inventory, settings)
  demoData.js       — Demo receipt scenarios + donation/compost locations
  receipt.js        — Receipt parsing, alias matching, inventory creation
  ai.js             — AI provider fallback (Gemini → OpenAI → heuristic)
  planner.js        — Shopping suggestions + risk summary
  routing.js        — Eat/donate/compost/failure routing logic
stitch templates/   — Original Google Stitch UI design references
```

## Design

The UI combines Google Stitch's Material Design 3 templates with Cursor's working JavaScript. Key design elements:

- M3 color palette (primary green `#3d653e`, error red `#ba1a1a`)
- Manrope (headlines) + Inter (body) fonts
- Material Symbols Outlined icons
- Sticky side navigation with scroll-tracking highlights
- Risk color coding: red (<=3 days), amber (4-7 days), green (>7 days)
- CSS custom property fallback for offline use (hackathon Wi-Fi)

## MVP Boundaries

- In scope: receipt import + alias memory, recipe generation + shopping suggestions, donate/compost/failure routing + summary
- Out of scope: user accounts/auth, production backend/database, full donation API integration

## Team

- Ali: frontend screens and UX flow
- Steve: AI/data pipeline and provider fallback logic
- Dave: sustainability routing, metrics, and demo flow

## License

MIT
