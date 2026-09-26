import { v } from "convex/values";
import { internalQuery, internalMutation, query } from "./_generated/server";
import { FOOD101_DISHES } from "./food101Dishes";

/**
 * Cache for food-database lookups (Open Food Facts / USDA FoodData Central).
 * Lives outside the "use node" module because Convex only allows actions there.
 */
export const readCache = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("foodCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return row ?? null;
  },
});

const CACHE_MAX = 2000;

export const writeCache = internalMutation({
  args: { key: v.string(), payload: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foodCache")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { payload: args.payload, createdAt: Date.now() });
      return;
    }
    // Simple size guard: drop the oldest rows once the cache grows past CACHE_MAX.
    const rows = await ctx.db.query("foodCache").collect();
    if (rows.length >= CACHE_MAX) {
      const oldest = [...rows].sort((a, b) => a.createdAt - b.createdAt).slice(0, Math.ceil(CACHE_MAX * 0.2));
      for (const row of oldest) await ctx.db.delete(row._id);
    }
    await ctx.db.insert("foodCache", { key: args.key, payload: args.payload, createdAt: Date.now() });
  },
});

/** Food-101 dish vocabulary — suggestion chips for the AI scanner (reference only). */
export const food101Dishes = query({
  args: { count: v.optional(v.number()) },
  handler: async (_ctx, args) => {
    const count = Math.min(Math.max(args.count ?? 24, 1), FOOD101_DISHES.length);
    return FOOD101_DISHES.slice(0, count);
  },
});
