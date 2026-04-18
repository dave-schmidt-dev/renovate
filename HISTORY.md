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
