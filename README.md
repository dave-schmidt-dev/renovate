# Leftover Lens

Leftover Lens is a local sustainability web app for an NVCC hackathon team of 3.

## What It Does

- Bulk-imports groceries from receipt text/file input.
- Learns short receipt aliases (example: `MLK 2%` -> `milk`) for future scans.
- Generates recipes that prioritize foods closest to spoilage.
- Builds suggested shopping items for missing recipe ingredients.
- Routes leftovers using policy: `eat -> donate -> compost -> failure`.
- Tracks `failure` count as a primary sustainability metric.

## Quick Start

1. From this folder, run:
   - `python3 -m http.server 4173`
2. Open `http://localhost:4173`
3. Use **Load Demo Scenario** or paste receipt lines.
4. Click **Scan Receipt**, review aliases, then **Confirm & Import**.
5. Click **Generate Recipes**.

## Cheap/Free AI Provider Order

The app is built with fallback order:

1. Local parsing/OCR-compatible flow (Tesseract.js-ready path)
2. Gemini Flash (primary live provider)
3. OpenAI mini model (backup)
4. Local heuristic fallback in Mock Mode

Mock Mode is on by default so the demo always works offline.

## MVP Boundaries (6 Hours)

- In scope:
  - Receipt mass import + alias memory
  - Recipe generation + missing-ingredient shopping suggestions
  - Donate/compost/failure routing + summary
- Out of scope:
  - User accounts/auth
  - Production backend/database
  - Full donation API integration (stubbed recommendations included)

## Team Split

- Ali: frontend screens and UX flow
- Steve: AI/data pipeline and provider fallback logic
- Dave: sustainability routing, metrics, and demo flow

## Demo Scenarios

Pre-seeded receipt scenarios are included in `modules/demoData.js` and cover:

- high-spoilage produce + dairy
- mixed produce/protein pantry
- reusable shelf-stable + short-life mix
