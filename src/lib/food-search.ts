/**
 * Worldwide food search powered by Open Food Facts — a free, open database of
 * more than 3 million products from all over the world. No API key required.
 *
 * Docs: https://world.openfoodfacts.org/data
 */

export type FoodSearchResult = {
  /** Stable OFF id: the barcode. */
  id: string;
  name: string;
  brand: string | null;
  /** Localized name when available, else English name. */
  displayName: string;
  /** kcal per 100 g (or per 100 ml for drinks). */
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
  /** 0-100 nutrition score, higher = better. Used for a small health badge. */
  nutriScore: number | null;
  imageUrl: string | null;
};

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  product_name_nl?: string;
  brands?: string;
  serving_size?: string;
  image_small_url?: string;
  nutriments?: Record<string, unknown>;
};

function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickName(product: OffProduct): string {
  return (
    product.product_name_en?.trim() ||
    product.product_name_nl?.trim() ||
    product.product_name?.trim() ||
    "Unnamed product"
  );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toResult(product: OffProduct): FoodSearchResult | null {
  const code = product.code?.trim();
  const nutriments = product.nutriments ?? {};
  const name = pickName(product);
  const isDrink = Boolean(nutriments["is_beverage"]) || /\.(ml|cl|l)$/i.test(product.serving_size ?? "");
  const kcal = num(nutriments["energy-kcal_100g"]);
  if (!code || name.length < 2 || /^\\d+$/.test(name) || kcal <= 0) return null;
  const unit: "g" | "ml" = isDrink ? "ml" : "g";
  return {
    id: code,
    name,
    brand: product.brands?.split(",")[0]?.trim() || null,
    displayName: name,
    kcalPer100: Math.round(kcal),
    proteinPer100: round1(num(nutriments["proteins_100g"])),
    carbsPer100: round1(num(nutriments["carbohydrates_100g"])),
    fatPer100: round1(num(nutriments["fat_100g"])),
    fiberPer100: round1(num(nutriments["fiber_100g"])),
    sugarPer100: round1(num(nutriments["sugars_100g"])),
    sodiumPer100: round1(num(nutriments["sodium_100g"]) * 1000 || num(nutriments["salt_100g"]) * 400),
    servingGrams: parseServingGrams(product.serving_size),
    unit,
    nutriScore: parseNutriScore(nutriments["nutrition-score-fr"]),
    imageUrl: product.image_small_url ?? null,
  };
}

/** "150 g" | "1.5 l" | "330 ml" -> grams (ml treated 1:1 as grams). */
function parseServingGrams(serving: string | undefined): number | null {
  if (!serving) return null;
  const match = serving.match(/([\\d.,]+)\\s*(g|kg|ml|cl|l|oz)\\b/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2].toLowerCase();
  const grams = unit === "kg" ? value * 1000 : unit === "cl" ? value * 10 : unit === "l" ? value * 1000 : unit === "oz" ? value * 28.35 : value;
  return Math.round(Math.min(2000, grams));
}

const NUTRI_SCORE_MAX = 40; // worst possible "nutrition-score-fr" value

function parseNutriScore(score: unknown): number | null {
  const value = Number(score);
  if (!Number.isFinite(value)) return null;
  // Map OFF score (-15 best .. 40 worst) to 0-100 where higher = better.
  return Math.round(((NUTRI_SCORE_MAX - value) / (NUTRI_SCORE_MAX + 15)) * 100);
}

const OFF_HEADERS = { "User-Agent": "KOVA AI - kovaai.dev - web app v1.0 (https://kovaai.dev)" };

async function offFetch(url: string): Promise<OffProduct[]> {
  const response = await fetch(url, { headers: OFF_HEADERS });
  if (!response.ok) throw new Error("Could not reach the food database. Try again.");
  const data = (await response.json()) as { products?: OffProduct[] } | { status?: number; product?: OffProduct };
  if ("product" in data && data.product) return [data.product];
  if ("products" in data && data.products) return data.products;
  return [];
}

export async function searchFoods(query: string, page = 1): Promise<FoodSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}` +
    `&search_simple=1&action=process&json=1&page=${page}&page_size=24&fields=` +
    "code,product_name,product_name_en,product_name_nl,brands,serving_size,image_small_url,nutriments";
  const products = await offFetch(url);
  return products.map(toResult).filter((item): item is FoodSearchResult => item !== null);
}

export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const clean = barcode.replace(/\\D/g, "");
  if (clean.length < 6) return null;
  const products = await offFetch(
    `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=code,product_name,product_name_en,product_name_nl,brands,serving_size,image_small_url,nutriments`,
  );
  return products.length ? toResult(products[0]) : null;
}

/** Popular, everyday foods shown as suggestions before the user types. */
export async function popularFoods(): Promise<FoodSearchResult[]> {
  // OFF does not expose "popular" via search; a few evergreen queries give a stable, useful list.
  const seeds = ["chicken breast", "banana", "white rice", "greek yogurt", "oatmeal", "eggs"];
  const results = await Promise.all(seeds.map((seed) => searchFoods(seed, 1).then((items) => items[0]).catch(() => null)));
  const seen = new Set<string>();
  return results.filter((item): item is FoodSearchResult => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

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

/** Store a food in recents and bump its frequency so it ranks higher in search. */
export function rememberFood(food: FoodSearchResult): RecentFood[] {
  const current = loadRecentFoods().filter((item) => item.id !== food.id);
  const previous = current.find((item) => item.id === food.id);
  void previous;
  const prior = readStore<RecentFood & { count?: number }>(RECENTS_KEY).find((item) => item.id === food.id);
  const count = (prior?.count ?? 0) + 1;
  const next = [{ ...food, savedAt: Date.now(), count }, ...current].slice(0, 24) as Array<RecentFood & { count?: number }>;
  writeStore(RECENTS_KEY, next);
  return next as RecentFood[];
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

/** Local, offline fallback shown when the database has no match. */
export function quickAddLocal(name: string, grams: number, unit: string, times: number) {
  return {
    name: times > 1 ? `${name} ×${times}` : name,
    grams: Math.round(grams * times),
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    unit,
  };
}
