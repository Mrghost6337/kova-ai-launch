"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { offSearchUncached, offBarcodeUncached, usdaSearchUncached, type NormalizedFood } from "./foodProviders";

/**
 * Server-side food data integration for the KOVA Food page.
 *
 * Sources:
 * - Open Food Facts v2 API (primary; no key required) — branded/international
 *   products, images, barcodes.
 * - USDA FoodData Central (nutrition source; requires USDA_API_KEY in the Convex
 *   environment) — generic foods with accurate reference values.
 *
 * Results are cached in the `foodCache` table (see foodCache.ts) so repeat
 * searches and barcode scans never re-hit the upstream APIs. No datasets are
 * shipped to the client; the browser only receives normalized, sized results.
 */

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SearchResult = v.object({
  id: v.string(),
  source: v.union(v.literal("off"), v.literal("usda")),
  name: v.string(),
  brand: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  ingredients: v.union(v.string(), v.null()),
  servingGrams: v.union(v.number(), v.null()),
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
});

/**
 * Unified food search: OFF primary, USDA merged in when a key is configured.
 * Cached server-side per query.
 */
export const searchFoods = action({
  args: { query: v.string() },
  returns: v.array(SearchResult),
  handler: async (ctx, args): Promise<NormalizedFood[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You need to be signed in to search foods.");

    const query = args.query.trim().slice(0, 80);
    if (query.length < 2) return [];

    const key = `search:v2:${query.toLowerCase()}`;
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return hit.payload as NormalizedFood[];

    const apiKey = process.env.USDA_API_KEY;
    const tasks: Array<Promise<NormalizedFood[]>> = [offSearchUncached(query)];
    if (apiKey) tasks.push(usdaSearchUncached(query, apiKey).catch(() => []));

    const [off, usda] = await Promise.all(tasks);
    // OFF first (products, images), then USDA generic foods the OFF query missed.
    const merged: NormalizedFood[] = [];
    const seen = new Set<string>();
    for (const item of [...off, ...usda]) {
      const dedupe = `${item.name.toLowerCase().split(",")[0].slice(0, 40)}|${item.brand ?? ""}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      merged.push(item);
      if (merged.length >= 30) break;
    }
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: merged });
    return merged;
  },
});

/** Barcode lookup via Open Food Facts (primary). Cached per barcode. */
export const lookupBarcode = action({
  args: { barcode: v.string() },
  returns: v.union(SearchResult, v.null()),
  handler: async (ctx, args): Promise<NormalizedFood | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You need to be signed in to scan barcodes.");

    const barcode = args.barcode.replace(/\D/g, "").slice(0, 20);
    if (barcode.length < 6) return null;

    const key = `barcode:v2:${barcode}`;
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return (hit.payload as NormalizedFood | null);

    const product = await offBarcodeUncached(barcode);
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: product });
    return product;
  },
});

/** Popular starter list (OFF evergreens), cached server-side. */
export const popularFoods = action({
  args: {},
  returns: v.array(SearchResult),
  handler: async (ctx): Promise<NormalizedFood[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You need to be signed in.");

    const key = "popular:v1";
    const hit = await ctx.runQuery(internal.foodCache.readCache, { key });
    if (hit && Date.now() - hit.createdAt < CACHE_TTL_MS) return hit.payload as NormalizedFood[];

    const seeds = ["chicken breast", "banana", "white rice", "greek yogurt", "oatmeal", "eggs"];
    const results = await Promise.all(seeds.map((seed) => offSearchUncached(seed).then((items) => items[0]).catch(() => null)));
    const seen = new Set<string>();
    const merged = results.filter((item): item is NormalizedFood => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    await ctx.runMutation(internal.foodCache.writeCache, { key, payload: merged });
    return merged;
  },
});
