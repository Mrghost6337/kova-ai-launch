/**
 * Client-side food utilities for the KOVA Food page.
 *
 * Search, barcode lookup and popular suggestions run through the Convex
 * backend (`src/convex/foodData.ts`), which talks to Open Food Facts (primary)
 * and USDA FoodData Central and caches every result server-side. This module
 * keeps only the pure client-side pieces: the result shape, portion math and
 * the local recents/favorites store.
 */

export type FoodSearchResult = {
  /** Stable id from the backend, e.g. "off:8710398513003" or "usda:173944". */
  id: string;
  name: string;
  brand: string | null;
  displayName: string;
  /** Nutrition per 100 g (or per 100 ml for drinks). */
  kcalPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  sugarPer100: number;
  /** mg per 100 g/ml. */
  sodiumPer100: number;
  /** Typical serving size in grams as printed on the package, when known. */
  servingGrams: number | null;
  /** Unit used for the "per 100" values. */
  unit: "g" | "ml";
  imageUrl: string | null;
};

/* ---------- Portion math ---------- */

export type Portion = {
  /** Amount of grams (or ml) the user picked. */
  grams: number;
  /** How many times they eat this portion. */
  times: number;
};

export function scaleResult(food: FoodSearchResult, portion: Portion) {
  const factor = (portion.grams / 100) * portion.times;
  return {
    name: portion.times > 1 ? `${food.displayName} ×${portion.times}` : food.displayName,
    grams: Math.round(portion.grams * portion.times),
    calories: Math.round(food.kcalPer100 * factor),
    protein_g: Math.round(food.proteinPer100 * factor),
    carbs_g: Math.round(food.carbsPer100 * factor),
    fat_g: Math.round(food.fatPer100 * factor),
    fiber_g: Math.round(food.fiberPer100 * factor),
    sugar_g: Math.round(food.sugarPer100 * factor),
    sodium_mg: Math.round(food.sodiumPer100 * factor),
  };
}

export function formatServing(food: FoodSearchResult): string {
  if (food.servingGrams) return `${food.servingGrams} ${food.unit} per serving`;
  return `per 100 ${food.unit}`;
}

/* ---------- Recents & favorites (localStorage) ---------- */

export type RecentFood = FoodSearchResult & { savedAt: number };

const RECENTS_KEY = "kova.food.recents.v1";
const FAVORITES_KEY = "kova.food.favorites.v1";

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — recents/favorites are a nice-to-have.
  }
}

export function loadRecentFoods(): RecentFood[] {
  return readStore<RecentFood>(RECENTS_KEY).slice(0, 24);
}

/** Store a food in recents so it appears first next time. */
export function rememberFood(food: FoodSearchResult): RecentFood[] {
  const current = loadRecentFoods().filter((item) => item.id !== food.id);
  const next = [{ ...food, savedAt: Date.now() }, ...current].slice(0, 24);
  writeStore(RECENTS_KEY, next);
  return next;
}

export function clearRecentFoods(): void {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    // Ignore.
  }
}

export function removeRecentFood(id: string): RecentFood[] {
  const next = loadRecentFoods().filter((item) => item.id !== id);
  writeStore(RECENTS_KEY, next);
  return next;
}

export function loadFavoriteFoods(): RecentFood[] {
  return readStore<RecentFood>(FAVORITES_KEY).slice(0, 24);
}

export function toggleFavoriteFood(food: FoodSearchResult): { favorites: RecentFood[]; isFavorite: boolean } {
  const favorites = loadFavoriteFoods();
  const exists = favorites.some((item) => item.id === food.id);
  const next = exists
    ? favorites.filter((item) => item.id !== food.id)
    : [{ ...food, savedAt: Date.now() }, ...favorites].slice(0, 24);
  writeStore(FAVORITES_KEY, next);
  return { favorites: next, isFavorite: !exists };
}
