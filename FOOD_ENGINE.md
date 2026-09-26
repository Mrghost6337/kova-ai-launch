# KOVA Food Engine

One unified backend (`src/convex/foodData.ts` + `src/convex/foodProviders.ts`) that the
Food page, barcode scanner and AI photo scanner all use. The UI never needs to know
which database a result came from — every result carries a `source` field, one
normalized shape, and honest flags for dishes and estimates.

```
UI (FoodPicker / FoodScanDialog)
  → Convex action (foodData.ts / food.ts)          [KOVA backend]
    → query correction (typos, EN/NL/FR/DE words)  [foodProviders.ts]
    → source fan-out with intent-based priority    [OFF / USDA / Dietly]
    → normalize to one shape (never merge values)  [NormalizedFood]
    → cache in foodCache table (30-day TTL, 2k rows)
  → normalized, sized results to the client
```

## Data sources & licenses

| Source | Used for | License | Key | Attribution |
| --- | --- | --- | --- | --- |
| [Open Food Facts](https://world.openfoodfacts.org) ([API](https://openfoodfacts.github.io/openfoodfacts-server/api/)) | Packaged/branded products, barcodes, images, ingredients, allergens | **Database: ODbL 1.0** (share-alike); content images CC BY-SA 4.0 / public domain per product | none | "Food data courtesy of Open Food Facts" required for ODbL-derived data. KOVA serves the data through its own API layer; attribute Open Food Facts wherever OFF data is displayed or exported. |
| [USDA FoodData Central](https://fdc.nal.usda.gov/) ([API](https://fdc.nal.usda.gov/api-guide.html)) | Generic foods, raw/cooked ingredients, reference nutrition | **US public domain (CC0-equivalent)** — no attribution required, none prohibited | `USDA_API_KEY` (Convex env) | Optional; polite to credit "USDA FoodData Central". |
| [Dietly API](https://www.getdietly.com/api-guide.html) ([examples repo](https://github.com/Jelteh962/dietly-api)) | Gap-filler search + barcode fallback (4.7M foods) | **Data governed by upstream licenses** — Dietly rows are re-served OFF (ODbL) or USDA (public domain) data. Their example *code* is MIT; the *data* is not. | `DIETLY_API_KEY` (Convex env, optional) | **Commercial use requires a paid Dietly plan.** The free/anonymous tier is evaluation-only: KOVA therefore only activates Dietly when `DIETLY_API_KEY` is set. Dietly rows with upstream `source: "claude"` (AI estimate) or `"community"` (user submissions) are rejected in `normalizeDietly` — KOVA never serves those. |
| [OpenNutrition](https://github.com/deadletterq/mcp-opennutrition) | Evaluated — **not integrated** | Data: ODbL; MCP server code: GPL-3.0 | — | Ships only as a self-hosted MCP/Docker server (no hosted API), so it cannot run on Convex. Its data overlaps USDA/CNF/FRIDA/AUSNUT sources KOVA already covers. Re-evaluate if they publish a hosted API. |
| [Nutrition5k](https://github.com/google-research-datasets/Nutrition5k) | Evaluated — **not used for search** | CC BY 4.0 (dataset) | — | Research dataset for dietary assessment; useful for future food-image recognition model training/evaluation, not as a consumer search database. Deliberately excluded from the Food Engine per project decision. |
| Food-101 | Dish-name vocabulary only (`food101Dishes.ts`) | Dataset for research; **no nutrition values are taken from it** | — | Used solely to steer the AI scanner toward consistent dish names and dish suggestion chips. |

### License rules KOVA follows

1. A GitHub repository being MIT (Dietly's example code) does **not** mean the data it
   returns is MIT — Dietly's own README states data follows upstream licenses.
2. OFF data is ODbL share-alike: KOVA must attribute Open Food Facts when serving
   OFF-derived data and must not present it as proprietary.
3. KOVA never serves AI-generated or community-submitted nutrition values from third
   parties (`normalizeDietly` rejects `claude`/`community` rows).
4. USDA key handling: the key lives only in the Convex environment, never the client.

### Rate limits & caching

- OFF community API: polite usage, custom `User-Agent` (`KOVA AI - kovaai.dev`), every
  response cached server-side for 30 days (`foodCache` table, max 2000 rows, LRU-ish
  eviction). Repeat searches, barcodes and category taps never re-hit upstream.
- USDA: 1,000 req/hour on the free demo key — same 30-day cache applies.
- Dietly: 30 req/min anonymous / 500 req/min with key — used only as gap-filler
  (<3 primary results), which keeps it well under limits.
- Barcode lookups cache misses too, so a failed scan is not retried against upstream
  until the cache expires.

## Search behavior

- Typo-tolerant: `correctQuery` fixes common misspellings (`chiken`→`chicken`,
  `spagetti`→`spaghetti`, …) plus Dutch/Belgian (`kip`, `witloof`, `volkoren`),
  French (`poulet`, `fromage`) and German (`kartoffeln`, `käse`) food words, with
  Levenshtein fallback (distance ≤1, ≤2 for long words).
- The UI shows a "Searched for …" hint when a correction was applied; if the corrected
  query finds nothing, the user's original spelling is retried before giving up.
- Intent-based source priority, decided per query from relevance:
  - Generic food (USDA hits are relevant) → **USDA first**, then OFF, then Dietly.
  - Packaged/branded (no relevant USDA hits) → **OFF first**, then USDA, then Dietly.
- Conflicting values are **never merged**; each result keeps its own source data and
  `source` / `source_id` (the prefixed `id`).

## Honest-data rules

- Nutrition always comes from the matched database row, scaled by quantity. Nothing is
  invented: no calories, no macros, no serving sizes, no names, no images.
- Complete dishes are flagged (`dish: true`) and the UI shows a disclaimer that values
  are a database reference for a typical preparation, not the user's exact recipe.
- Dietly estimates are flagged (`estimate: true`) in the UI when they slip through
  upstream as such.
- Missing images render a neutral food placeholder icon — never random stock photos.
- Missing data stays missing ("unavailable"), fields show 0 only when the source
  actually reports 0.
- AI scanner: the vision model recognizes food names and portion sizes only; every
  nutrition value comes from a database match. Unmatched items return zeros, are
  clearly marked, and must be edited or removed by the user.

## Environment variables (Convex)

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | for AI photo scanning | Vision model (Qwen2.5-VL) |
| `USDA_API_KEY` | recommended | Generic-food reference values (works without, but OFF-only) |
| `DIETLY_API_KEY` | optional | Enables the Dietly gap-filler (commercial use requires their paid plan) |
| `FOOD_VISION_MODEL` | optional | Override the vision model |

## Supabase storage

Food logs live in `food_entries` (see `supabase/schema.sql`): `food_id`, `source`,
`food name`, `image_url`, `quantity`, `unit`, per-portion nutrition, `date`, `meal`,
`user_id`. The external database is never duplicated per user — only the normalized
snapshot of what was logged. Recents and favorites additionally live in localStorage
for instant access, seeded from real history (`useFoodHistory`), never faked.
