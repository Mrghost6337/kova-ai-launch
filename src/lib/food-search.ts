/**
 * Client-side food utilities for the KOVA Food page.
 *
 * Search, barcode lookup and popular suggestions run through the Convex
 * backend (`src/convex/foodData.ts` — the KOVA Food Engine), which talks to
 * Open Food Facts, USDA FoodData Central and (optionally) Dietly and caches
 * every result server-side. This module keeps the pure client-side pieces:
 * the result shape, the unit/portion engine and the local recents/favorites
 * store.
 */

export type FoodSearchResult = {
  /** Stable id from the backend, e.g. "off:8710398513003" or "usda:173944". */
  id: string;
  name: string;
  brand: string | null;
  displayName: string;
  /** Which database this food came from ("off" | "usda" | "dietly"). */
  source: string;
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
  /** Gram weight of one declared piece, when the source declares it. */
  pieceGrams: number | null;
  /** Unit used for the "per 100" values. */
  unit: "g" | "ml";
  imageUrl: string | null;
  /** Comma-separated allergen labels from the source, when published. */
  allergens?: string | null;
  /** True for complete dishes — values are a database reference, not a recipe. */
  isDish?: boolean;
  /** True when the values are an estimate rather than a measured value. */
  isEstimate?: boolean;
};

/* ---------- Unit engine ---------- */

/**
 * Units the food logger supports. Only the units that make sense for the
 * selected food are offered (see `availableUnits`).
 */
export type PortionUnit = "g" | "kg" | "oz" | "ml" | "l" | "serving" | "piece" | "cup" | "tbsp" | "tsp";

export const UNIT_LABELS: Record<PortionUnit, string> = {
  g: "g",
  kg: "kg",
  oz: "oz",
  ml: "ml",
  l: "L",
  serving: "serving",
  piece: "piece",
  cup: "cup",
  tbsp: "tbsp",
  tsp: "tsp",
};

const OZ_GRAMS = 28.35;
const CUP_ML = 240;
const TBSP_ML = 15;
const TSP_ML = 5;

/**
 * Gram weight of one metric cup (tbsp = cup/16, tsp = cup/48) for foods that
 * are genuinely measured by volume, from USDA household-measure references.
 * Foods without a match here are never offered cup/tbsp/tsp — KOVA does not
 * guess densities.
 */
const CUP_GRAMS: ReadonlyArray<readonly [RegExp, number]> = [
  [/\bcooked\b.*\brice\b|\brice\b.*\bcooked\b/, 158],
  [/\brice\b/, 185],
  [/\bquinoa\b/, 170],
  [/\bcouscous\b/, 173],
  [/\bpasta\b|\bspaghetti\b|\bmacaroni\b|\bpenne\b|\bfusilli\b|\bnoodles?\b/, 100],
  [/\boats?\b|\boatmeal\b|\bporridge\b|\bmuesli\b|\bgranola\b/, 81],
  [/\bflour\b/, 125],
  [/\bsugar\b/, 200],
  [/\boil\b/, 218],
  [/\bhoney\b/, 339],
  [/\bsyrup\b|\bmaple\b/, 322],
  [/\bpeanut butter\b/, 258],
  [/\bbutter\b/, 227],
  [/\bmilk\b|\bbuttermilk\b|\bkefir\b/, 244],
  [/\byogurt\b|\byoghurt\b/, 245],
  [/\bcream\b/, 238],
  [/\bcottage cheese\b/, 226],
  [/\blentils?\b|\bchickpeas\b|\bbeans\b/, 198],
  [/\bsoup\b|\bbroth\b|\bchili\b|\bstew\b|\bsmoothie\b|\bjuice\b|\bwater\b|\bcoffee\b|\btea\b|\bcocoa\b|\bmilkshake\b/, 240],
];

/** Gram weight of one cup for this food, or null when volume units don't apply. */
function cupGrams(food: FoodSearchResult): number | null {
  // Drinks and other per-ml foods have density ≈ 1: volume units are honest.
  if (food.unit === "ml") return CUP_ML;
  const name = `${food.name} ${food.brand ?? ""}`.toLowerCase();
  const match = CUP_GRAMS.find(([pattern]) => pattern.test(name));
  return match ? match[1] : null;
}

/** Units that make sense for this food, in display order. */
export function availableUnits(food: FoodSearchResult): PortionUnit[] {
  const units: PortionUnit[] = ["g"];
  if (food.unit === "ml") {
    units.push("ml", "l", "cup", "tbsp", "tsp");
  } else {
    units.push("kg", "oz");
    if (cupGrams(food)) units.push("cup", "tbsp", "tsp");
  }
  if (food.servingGrams) units.push("serving");
  if (food.pieceGrams) units.push("piece");
  return units;
}

/** Convert an amount in the given unit to grams (or ml for per-ml foods). */
export function unitToGrams(food: FoodSearchResult, unit: PortionUnit, amount: number): number {
  switch (unit) {
    case "g":
    case "ml":
      return amount;
    case "kg":
    case "l":
      return amount * 1000;
    case "oz":
      return amount * OZ_GRAMS;
    case "serving":
      return amount * (food.servingGrams ?? 100);
    case "piece":
      return amount * (food.pieceGrams ?? food.servingGrams ?? 100);
    case "cup":
      return amount * (cupGrams(food) ?? CUP_ML);
    case "tbsp":
      return amount * ((cupGrams(food) ?? CUP_ML) / 16);
    case "tsp":
      return amount * ((cupGrams(food) ?? CUP_ML) / 48);
  }
}

/* ---------- Portion math ---------- */

export type Portion = {
  /** Amount in the chosen unit. */
  amount: number;
  unit: PortionUnit;
  /** How many times they eat this portion. */
  times: number;
};

/** Scale a food to the chosen portion. Nutrition always comes from the source data. */
export function scaleResult(food: FoodSearchResult, portion: Portion) {
  const grams = unitToGrams(food, portion.unit, portion.amount) * portion.times;
  const factor = grams / 100;
  return {
    name: portion.times > 1 ? `${food.displayName} ×${portion.times}` : food.displayName,
    grams: Math.round(grams),
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
