"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  offSearchUncached,
  offBarcodeUncached,
  usdaSearchUncached,
  offCategorySearch,
  dietlySearchUncached,
  dietlyBarcodeUncached,
  correctQuery,
  detectDish,
  type NormalizedFood,
} from "./foodProviders";
import { findCategory } from "../lib/food-categories";

/**
 * KOVA Food Engine — unified backend for the Food page.
 *
 * One search API, three sources, one normalized shape. The UI never needs to
 * know which database a food came from:
 *
 * - Open Food Facts: primary for packaged/branded products (images, barcodes).
 * - USDA FoodData Central: primary for generic foods (reference nutrition).
 * - Dietly: optional gap-filler, only active with DIETLY_API_KEY, and only for
 *   records whose upstream source is off/usda (never AI or community rows).
 *
 * Which source leads is decided per query: if USDA has relevant generic hits
 * the search is a "generic food" query (USDA first); otherwise the query names
 * a branded product and OFF leads. Values are never merged across sources —
 * each result keeps its original source data. Everything is cached in the
 * `foodCache` table (see foodCache.ts). No datasets ship to the client.
 *
 * See FOOD_ENGINE.md for source licensing and attribution.
 */

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SearchResult = v.object({
  id: v.string(),
  source: v.union(v.literal("off"), v.literal("usda"), v.literal("dietly")),
  name: v.string(),
  brand: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  ingredients: v.union(v.string(), v.null()),
  allergens: v.union(v.string(), v.null()),
  servingGrams: v.union(v.number(), v.null()),
  pieceGrams: v.union(v.number(), v.null()),
  unit: v.union(v.literal("g"), v.literal("ml")),
  per100: v.object({
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.number(),
    sugar: v.number(),
    sodium: v.number(),
  }),
  barcode: v.union(v.string(), v.null()),
  dish: v.optional(v.boolean()),
  estimate: v.optional(v.boolean()),
});

type SearchNote = { corrected?: string };

/** Merge result lists in priority order, deduping same-name-same-brand rows. */
function mergeResults(lists: NormalizedFood[][], limit: number): NormalizedFood[] {
  const merged: NormalizedFood[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const item of list) {
      const dedupe = `${item.name.toLowerCase().split(",")[0].slice(0, 40)}|${item.brand ?? ""}`;
      if (seen.has(dedupe) || seen.has(item.id)) continue;
      seen.add(dedupe);
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= limit) return merged;
    }
  }
  return merged;
}

/** True when the USDA results are relevant to the query (generic-food signal). */
function usdaHasRelevantHits(query: string, usda: NormalizedFood[]): boolean {
  const words = query.split(" ").filter((word) => word.length > 2);
  return usda.some((item) => {
    const name = item.name.toLowerCase();
    return name.includes(query) || words.every((word) => name.includes(word));
  });
}

/** One unified food search across all sources. */
export const searchFoods = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    items: v.array(SearchResult),
    note: v.object({ corrected: v.optional(v.string()) }),
  }),
  handler: async (ctx, args): Promise<{ items: NormalizedFood[]; note: SearchNote }> => {
    const raw = args.query.trim().slice(0, 80);
    if (raw.length < 2) return { items: [], note: {} };
    const limit = Math.min(Math.max(args.limit ?? 30, 5), 50);

    const corrected = correctQuery(raw);
    const correctionNote: SearchNote = corrected !== raw.toLowerCase() ? { corrected } : {};
    const key = `search:v3:${corrected.toLowerCase()}:${limit}`;
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) {
      return { items: hit.payload.items as NormalizedFood[], note: (hit.payload.note ?? {}) as SearchNote };
    }

    const usdaKey = process.env.USDA_API_KEY;
    const dietlyKey = process.env.DIETLY_API_KEY;
    const isDish = detectDish(corrected);

    // Source priority per query intent: USDA leads when it has relevant generic
    // hits; otherwise this names a packaged/branded product and OFF leads.
    const [off, usda] = await Promise.all([
      offSearchUncached(corrected).catch(() => [] as NormalizedFood[]),
      usdaKey ? usdaSearchUncached(corrected, usdaKey).catch(() => [] as NormalizedFood[]) : Promise.resolve([] as NormalizedFood[]),
    ]);

    const usdaLead = usdaHasRelevantHits(corrected, usda);
    let items = usdaLead
      ? mergeResults([usda, off], limit)
      : mergeResults([off, usda], limit);

    // Gap-filler: Dietly only when OFF+USDA left the query under-served.
    if (items.length < 3) {
      const dietly = await dietlySearchUncached(corrected, dietlyKey).catch(() => [] as NormalizedFood[]);
      items = usdaLead ? mergeResults([usda, off, dietly], limit) : mergeResults([off, usda, dietly], limit);
    }

    // Typo pass: when the correction changed the query and still nothing came
    // back, fall back to the user's original spelling before giving up.
    if (items.length === 0 && corrected !== raw.toLowerCase()) {
      const [rawOff, rawUsda] = await Promise.all([
        offSearchUncached(raw).catch(() => [] as NormalizedFood[]),
        usdaKey ? usdaSearchUncached(raw, usdaKey).catch(() => [] as NormalizedFood[]) : Promise.resolve([] as NormalizedFood[]),
      ]);
      items = mergeResults([rawOff, rawUsda], limit);
    }

    // Dish queries get flagged so the UI can label values honestly.
    const flagged = items.map((item) =>
      isDish && item.source === "usda" && /survey|fndds/i.test(item.name) ? { ...item, dish: true } : item,
    );

    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: { items: flagged, note: correctionNote } });
    return { items: flagged, note: correctionNote };
  },
});

/** Barcode lookup: OFF first, Dietly fallback. Cached per barcode (incl. misses). */
export const lookupBarcode = action({
  args: { barcode: v.string() },
  returns: v.union(SearchResult, v.null()),
  handler: async (ctx, args): Promise<NormalizedFood | null> => {
    const barcode = args.barcode.replace(/\D/g, "").slice(0, 20);
    if (barcode.length < 6) return null;

    const key = `barcode:v3:${barcode}`;
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return hit.payload as NormalizedFood | null;

    let product = await offBarcodeUncached(barcode).catch(() => null);
    if (!product) product = await dietlyBarcodeUncached(barcode, process.env.DIETLY_API_KEY).catch(() => null);
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: product });
    return product;
  },
});

/**
 * Category browse for the FoodPicker: OFF tag-filtered products first, then
 * seed-query results (USDA first for generic foods) for what the tags missed.
 * All merged, deduped and cached per category so repeat taps are instant.
 */
export const browseCategory = action({
  args: { category: v.string() },
  returns: v.array(SearchResult),
  handler: async (ctx, args): Promise<NormalizedFood[]> => {
    const category = findCategory(args.category);
    if (!category) return [];

    const key = `category:v2:${category.key}`;
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return hit.payload as NormalizedFood[];

    const apiKey = process.env.USDA_API_KEY;
    const tagTags = category.categories?.map((value) => ({ type: "categories" as const, value }));
    const labelTags = category.labels?.map((value) => ({ type: "labels" as const, value }));
    const seeds = category.seeds ?? [];

    const [tagResults, ...seedResults] = await Promise.all([
      offCategorySearch([...(tagTags ?? []), ...(labelTags ?? [])]).catch(() => [] as NormalizedFood[]),
      ...seeds.slice(0, 4).map(async (seed): Promise<NormalizedFood | null> => {
        if (apiKey) {
          try {
            const usda = await usdaSearchUncached(seed, apiKey);
            if (usda.length) return usda[0];
          } catch {
            // Fall through to OFF.
          }
        }
        return offSearchUncached(seed).then((items) => items[0]).catch(() => null);
      }),
    ]);

    const items = mergeResults(
      [tagResults, seedResults.filter((item): item is NormalizedFood => item !== null)],
      30,
    );
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: items });
    return items;
  },
});

/** Popular starter list (evergreen generic foods, USDA first), cached server-side. */
export const popularFoods = action({
  args: {},
  returns: v.array(SearchResult),
  handler: async (ctx): Promise<NormalizedFood[]> => {
    const key = "popular:v2";
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return hit.payload as NormalizedFood[];

    const apiKey = process.env.USDA_API_KEY;
    const seeds = ["chicken breast", "banana", "white rice", "greek yogurt", "oatmeal", "eggs"];
    const results = await Promise.all(
      seeds.map(async (seed): Promise<NormalizedFood | null> => {
        if (apiKey) {
          try {
            const usda = await usdaSearchUncached(seed, apiKey);
            if (usda.length) return usda[0];
          } catch {
            // Fall through to OFF.
          }
        }
        return offSearchUncached(seed).then((items) => items[0]).catch(() => null);
      }),
    );
    const items = mergeResults([results.filter((item): item is NormalizedFood => item !== null)], 12);
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: items });
    return items;
  },
});
