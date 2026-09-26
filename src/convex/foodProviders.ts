/**
 * Shared food-data providers for Convex node actions.
 *
 * - Open Food Facts (primary): branded/international products, images, barcodes.
 * - USDA FoodData Central: generic foods with reference nutrition values.
 *
 * Plain helper module (no Convex functions) so both foodData.ts and food.ts
 * can use the same normalization and search logic.
 */

export const OFF_BASE = "https://world.openfoodfacts.org";
export const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

export type NormalizedFood = {
  id: string;
  source: "off" | "usda";
  name: string;
  brand: string | null;
  imageUrl: string | null;
  ingredients: string | null;
  servingGrams: number | null;
  unit: "g" | "ml";
  per100: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  barcode: string | null;
};

/* ---------------- Open Food Facts ---------------- */

type OffNutriments = Record<string, unknown>;
export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  serving_size?: string;
  image_small_url?: string;
  nutriments?: OffNutriments;
};

function offNum(n: OffNutriments, key: string): number {
  const value = Number(n[key]);
  return Number.isFinite(value) ? value : 0;
}

/** "150 g" | "1.5 l" | "330 ml" -> grams (ml treated 1:1). */
export function parseServing(serving: string | undefined): number | null {
  if (!serving) return null;
  const match = serving.match(/([\d.,]+)\s*(g|kg|ml|cl|l|oz)\b/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2].toLowerCase();
  const grams = unit === "kg" ? value * 1000 : unit === "cl" ? value * 10 : unit === "l" ? value * 1000 : unit === "oz" ? value * 28.35 : value;
  return Math.round(Math.min(2000, grams));
}

export function normalizeOff(product: OffProduct): NormalizedFood | null {
  const code = product.code?.trim();
  const name = (product.product_name_en || product.product_name || "").trim();
  const n = product.nutriments ?? {};
  const kcal = offNum(n, "energy-kcal_100g");
  if (!code || name.length < 2 || kcal <= 0) return null;
  const isDrink = Boolean(n["is_beverage"]) || /\.(ml|cl|l)$/i.test(product.serving_size ?? "");
  return {
    id: `off:${code}`,
    source: "off",
    name: name.slice(0, 120),
    brand: product.brands?.split(",")[0]?.trim() || null,
    imageUrl: product.image_small_url ?? null,
    ingredients: (product.ingredients_text_en || product.ingredients_text || "").slice(0, 400) || null,
    servingGrams: parseServing(product.serving_size),
    unit: isDrink ? "ml" : "g",
    per100: {
      kcal: Math.round(kcal),
      protein: Math.round(offNum(n, "proteins_100g") * 10) / 10,
      carbs: Math.round(offNum(n, "carbohydrates_100g") * 10) / 10,
      fat: Math.round(offNum(n, "fat_100g") * 10) / 10,
      fiber: Math.round(offNum(n, "fiber_100g") * 10) / 10,
      sugar: Math.round(offNum(n, "sugars_100g") * 10) / 10,
      sodium: Math.round((offNum(n, "sodium_100g") || offNum(n, "salt_100g") / 2.5) * 1000),
    },
    barcode: code,
  };
}

export const OFF_FIELDS =
  "code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,serving_size,image_small_url,nutriments";

export async function offFetch(url: string): Promise<OffProduct[]> {
  const response = await fetch(url, { headers: { "User-Agent": "KOVA AI - kovaai.dev - web app v1.0 (https://kovaai.dev)" } });
  if (!response.ok) throw new Error(`Open Food Facts request failed (${response.status}).`);
  const data = (await response.json()) as { products?: OffProduct[] } | { status?: number; product?: OffProduct };
  if ("product" in data && data.product) return [data.product];
  if ("products" in data && data.products) return data.products;
  return [];
}

export async function offSearchUncached(query: string): Promise<NormalizedFood[]> {
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=1&page_size=24&fields=${OFF_FIELDS}`;
  const products = await offFetch(url);
  return products.map(normalizeOff).filter((item): item is NormalizedFood => item !== null).slice(0, 24);
}

export async function offBarcodeUncached(barcode: string): Promise<NormalizedFood | null> {
  const products = await offFetch(`${OFF_BASE}/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`);
  return products.length ? normalizeOff(products[0]) : null;
}

/* ---------------- USDA FoodData Central ---------------- */

export type UsdaFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: Array<{ nutrientName?: string; unitName?: string; value?: number }>;
};

export function usdaNormalize(food: UsdaFood): NormalizedFood | null {
  const name = (food.description || "").trim();
  if (!name || name.length < 2) return null;
  const byName = new Map<string, number>();
  for (const nutrient of food.foodNutrients ?? []) {
    if (nutrient.nutrientName && Number.isFinite(Number(nutrient.value))) {
      byName.set(nutrient.nutrientName.toLowerCase(), Number(nutrient.value));
    }
  }
  const kcal = byName.get("energy") ?? 0;
  if (kcal <= 0) return null;
  // FDC survey foods are per 100 g/ml; branded entries carry their own serving.
  const perServing = food.servingSize && food.servingSize > 0 && /g|ml/i.test(food.servingSizeUnit ?? "g") ? food.servingSize : 100;
  const scale = 100 / perServing;
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    id: `usda:${food.fdcId}`,
    source: "usda",
    name: name.slice(0, 120),
    brand: food.brandOwner?.trim() || null,
    imageUrl: null, // USDA has no product imagery.
    ingredients: food.ingredients?.slice(0, 400) || null,
    servingGrams: perServing <= 500 ? Math.round(perServing) : 100,
    unit: "g",
    per100: {
      kcal: Math.round(kcal * scale),
      protein: round((byName.get("protein") ?? 0) * scale),
      carbs: round((byName.get("carbohydrate, by difference") ?? 0) * scale),
      fat: round((byName.get("total lipid (fat)") ?? 0) * scale),
      fiber: round((byName.get("fiber, total dietary") ?? 0) * scale),
      sugar: round((byName.get("sugars, total including nlea") ?? byName.get("sugars, total") ?? 0) * scale),
      sodium: Math.round(byName.get("sodium, na") ?? 0),
    },
    barcode: null,
  };
}

export async function usdaSearchUncached(query: string, apiKey: string): Promise<NormalizedFood[]> {
  const url =
    `${USDA_BASE}/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}` +
    `&pageSize=15&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)&requireAllWords=false`;
  const response = await fetch(url);
  if (response.status === 403) throw new Error("USDA key rejected — check USDA_API_KEY in the Convex environment.");
  if (!response.ok) throw new Error(`USDA FoodData Central request failed (${response.status}).`);
  const data = (await response.json()) as { foods?: UsdaFood[] };
  return (data.foods ?? []).map(usdaNormalize).filter((item): item is NormalizedFood => item !== null).slice(0, 12);
}

/**
 * Best-effort match of a plain food name (e.g. from the AI scanner) against
 * OFF first, then USDA. Returns null when neither database has the food —
 * callers must NOT invent values in that case.
 */
export async function matchFoodByName(query: string, usdaApiKey: string | undefined): Promise<NormalizedFood | null> {
  const trimmed = query.trim().slice(0, 80);
  if (trimmed.length < 2) return null;
  try {
    const off = await offSearchUncached(trimmed);
    if (off.length) return off[0];
  } catch {
    // Fall through to USDA.
  }
  if (!usdaApiKey) return null;
  try {
    const usda = await usdaSearchUncached(trimmed, usdaApiKey);
    return usda[0] ?? null;
  } catch {
    return null;
  }
}
