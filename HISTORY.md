# History

## 2026-04-18 — Project Initialization

- **Cursor** generated the functional app: `index.html`, `styles.css`, `app.js`, and 6 JS modules in `modules/` (storage, demoData, receipt, ai, planner, routing). Fully working end-to-end in mock mode with receipt scanning, alias learning, recipe generation, and sustainability routing.
- **Google Stitch** generated 6 static HTML design templates in `stitch templates/` using Material Design 3 color system, Manrope + Inter fonts, Material Symbols icons. Templates cover: Dashboard, Alias Review modal, Receipt Import, Shopping List + Routing, Recipe Discovery, Inventory + Weekly Plan.
- Both contributions are disconnected — Cursor has logic but plain UI, Stitch has beautiful UI but zero JavaScript.

## 2026-04-18 — Merge: Apply Stitch Design to Cursor App

- Combined Cursor's working logic with Stitch's Material Design 3 design system
- Architecture decision: kept sequential single-page layout (rejected SPA view-switching as too risky for hackathon timeline)
- Applied M3 color palette, Manrope/Inter fonts, Material Symbols icons, Stitch card patterns
- Added sticky side navigation (desktop) with section scroll highlighting
- Bug fixes:
  - Fixed `receipt.js` `toInventoryItems()` ignoring user-edited expiry days
  - Fixed `routing.js` case-sensitive item name matching (broke with live AI providers)
  - Improved `ai.js` heuristic recipe name generation (replaced "Quick bananas skillet" patterns)
- Added CSS custom property fallback for offline demo (hackathon Wi-Fi reliability)
- Added "Quick Demo" one-click button for judges
- Design decisions documented in `plans/merge-cursor-stitch.md`

## 2026-04-18 — Feature Enhancements

- **Renamed to Parsly** (from Leftover Lens) — updated across all files, localStorage keys, API headers
- **OpenRouter integration** — replaced Gemini/OpenAI with single OpenRouter provider (GPT-4o-mini)
- **Receipt image OCR** — upload receipt photos, AI vision extracts food items automatically
- **USDA FoodKeeper database** — bundled 587 items / 1217 keywords from USDA FSIS for authoritative shelf life data
- **Real expiration dates** — items now store `expiresAt` ISO date, `daysLeft()` computes actual remaining time
- **Smart routing** — shelf-stable items (soda, candy, pasta) no longer marked as failure. Only truly expiring items get donate/compost
- **Confidence labels** — replaced confusing "90%" with "Known Alias", "AI Matched", "Best Guess", "Needs Review"
- **EmailJS integration** — send shopping lists via email (leftoverlens.app@gmail.com)
- **Food waste stats** — verified USDA/ReFED/UNEP statistics on dashboard
- **Manassas food pantries** — real donation locations (ACTS, House of Mercy, Sacred Heart, NVFS, Bull Run UU)
- **GitHub Pages deployment** — live at dave-schmidt-dev.github.io/renovate/
- **Parsly logo** — integrated into side nav and mobile top bar
- **Settings** — API key test connection with detailed error messages, inline save feedback
- **Clear Session** — preserves API keys, full page reload for clean state

## 2026-04-18 — Food Lifecycle Actions + UI Scaling

- **Mark Eaten / Donated / Composted** — action buttons on every routing card remove item from inventory and update all views (inventory, routing, dashboard) in real time
- **Collapsible grouped inventory** — items grouped by risk level (Expiring Soon / Use This Week / Fresh) with `<details>` expand/collapse, sorted by urgency within each group
- **Collapsible grouped routing** — routing cards grouped by route (Eat / Donate / Compost / Unresolved) with expand/collapse sections
- **Show more/fewer toggle** — lists with >5 items per group truncate and offer "Show all N items" toggle
- **Shopping list + recipe badge colors** — items to purchase now use blue (`info-container`) on both shopping list and recipe cards; inventory items stay green
- **Shopping badge label** — changed "required" to "to purchase" for clarity
- **Logo** — switched to transparent background version (`logo_nobg.png`)
- **Collaborators** — added @Valiyev-Ali (Ali) and @steveonw (Steve) as GitHub collaborators with write access
