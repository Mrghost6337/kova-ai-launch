/**
 * Shared food-data providers for Convex node actions — the KOVA Food Engine's
 * data layer.
 *
 * Sources (see FOOD_ENGINE.md for licenses):
 * - Open Food Facts (primary for packaged/branded foods): ODbL 1.0, no key.
 * - USDA FoodData Central (primary for generic foods): US public domain, needs
 *   USDA_API_KEY in the Convex environment.
 * - Dietly API (optional gap-filler): only used when DIETLY_API_KEY is set
 *   (their free tier forbids commercial use). Records whose upstream source is
 *   "claude" (AI estimate) or "community" (user submissions) are rejected.
 *
 * Plain helper module (no Convex functions) so foodData.ts and food.ts can use
 * the same normalization, correction and search logic.
 */

import { FOOD101_DISHES } from "./food101Dishes";

export const OFF_BASE = "https://world.openfoodfacts.org";
export const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
export const DIETLY_BASE = "https://api.getdietly.com";

export type FoodSource = "off" | "usda" | "dietly";

export type NormalizedFood = {
  id: string;
  source: FoodSource;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  ingredients: string | null;
  allergens: string | null;
  servingGrams: number | null;
  /** Gram weight of one declared piece, when the source declares it. */
  pieceGrams: number | null;
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
  /** True when the food is a complete dish (e.g. lasagna) rather than an ingredient. */
  dish?: boolean;
  /** True when values are an estimate rather than a measured database value. */
  estimate?: boolean;
};

/* ---------------- Query correction (typos + European food names) ---------------- */

/** Phrase fixes run first, then word fixes on word boundaries. */
const PHRASE_FIXES: ReadonlyArray<readonly [string, string]> = [
  ["pommes de terre", "potatoes"],
  ["chicken and rice", "chicken rice"],
  ["chicken & rice", "chicken rice"],
  ["stoofvlees", "beef stew"],
  ["carbonnade flamande", "beef stew"],
];

const SPELLING_FIXES: Readonly<Record<string, string>> = {
  // English typos
  chiken: "chicken",
  chichen: "chicken",
  chicke: "chicken",
  bannana: "banana",
  bananna: "banana",
  yoghurt: "yogurt",
  yougurt: "yogurt",
  yogourt: "yogurt",
  spagetti: "spaghetti",
  bolognaise: "bolognese",
  bolonese: "bolognese",
  bolignese: "bolognese",
  patato: "potato",
  patatoe: "potato",
  potatoe: "potato",
  patatoes: "potatoes",
  potatos: "potatoes",
  tomatos: "tomatoes",
  sandwhich: "sandwich",
  sandwitch: "sandwich",
  choclate: "chocolate",
  carots: "carrots",
  brocoli: "broccoli",
  broccolli: "broccoli",
  califlower: "cauliflower",
  stawberry: "strawberry",
  strawberrys: "strawberries",
  rasberry: "raspberry",
  bluberry: "blueberry",
  avacado: "avocado",
  advocado: "avocado",
  zuchini: "zucchini",
  omlette: "omelette",
  ceasar: "caesar",
  panckaes: "pancakes",
  mushroomns: "mushrooms",
  seriola: "amberjack",
  // Dutch/Belgian (NL/BE) food words
  kip: "chicken",
  kaas: "cheese",
  brood: "bread",
  melk: "milk",
  eieren: "eggs",
  aardappelen: "potatoes",
  aardappels: "potatoes",
  wortels: "carrots",
  spinazie: "spinach",
  prei: "leek",
  witloof: "chicory",
  chicon: "chicory",
  spruiten: "brussels sprouts",
  sperziebonen: "green beans",
  aardbeien: "strawberries",
  frambozen: "raspberries",
  bosbessen: "blueberries",
  appels: "apples",
  peren: "pears",
  bananen: "bananas",
  sinaasappels: "oranges",
  mandarijn: "mandarin",
  citroen: "lemon",
  uien: "onions",
  knoflook: "garlic",
  zalm: "salmon",
  tonijn: "tuna",
  garnaal: "shrimp",
  garnalen: "shrimp",
  haring: "herring",
  volkoren: "wholemeal",
  haver: "oats",
  yoghurt_: "yogurt",
  // French
  poulet: "chicken",
  boeuf: "beef",
  fromage: "cheese",
  yaourt: "yogurt",
  oeuf: "egg",
  // German
  "käse": "cheese",
  "hähnchen": "chicken",
  kartoffeln: "potatoes",
  joghurt: "yogurt",
};

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

const FIX_KEYS = Object.keys(SPELLING_FIXES);

/** Correct one word against the fix table, allowing small typos. */
function correctWord(word: string): string {
  if (SPELLING_FIXES[word]) return SPELLING_FIXES[word];
  if (word.length < 5) return word;
  let best: { word: string; distance: number } | null = null;
  for (const key of FIX_KEYS) {
    const distance = levenshtein(word, key);
    if (distance === 0) return SPELLING_FIXES[key];
    if (distance <= (key.length >= 7 ? 2 : 1) && (!best || distance < best.distance)) {
      best = { word: SPELLING_FIXES[key], distance };
    }
  }
  return best ? best.word : word;
}

/**
 * Normalize a food query: lowercase, phrase fixes, then typo fixes per word.
 * Returns the query to actually search with.
 */
export function correctQuery(query: string): string {
  let q = query.trim().toLowerCase().replace(/\s+/g, " ");
  for (const [from, to] of PHRASE_FIXES) q = q.split(from).join(to);
  return q
    .split(" ")
    .map(correctWord)
    .join(" ")
    .trim();
}

const DISH_PATTERNS: RegExp[] = [
  /\bchicken\s*(&|and)\s*rice\b/,
  /\b(breakfast|buddha|poke|burrito|protein)\s*bowl\b/,
  /\bsandwich(es)?\b/,
  /\bsalad\b/,
  /\bcurry\b/,
  /\bstir.?fry\b/,
  /\bsoup\b/,
  /\bcasserole\b/,
  /\bstew\b/,
  /\bbowl\b/,
];

/** True when the query looks like a complete dish rather than an ingredient. */
export function detectDish(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (FOOD101_DISHES.some((dish) => q === dish || q.includes(dish))) return true;
  return DISH_PATTERNS.some((pattern) => pattern.test(q));
}

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
  allergens?: string;
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

/** "en:gluten,en:eggs" -> "Gluten, Eggs". */
function humanizeTags(raw: string | undefined): string | null {
  if (!raw) return null;
  const labels = raw
    .split(",")
    .map((tag) => tag.trim().replace(/^[a-z]{2}:/, "").replace(/[-_]/g, " "))
    .filter(Boolean)
    .map((label) => label.charAt(0).toUpperCase() + label.slice(1));
  const unique = [...new Set(labels)];
  return unique.length ? unique.slice(0, 8).join(", ") : null;
}

export function normalizeOff(product: OffProduct): NormalizedFood | null {
  const code = product.code?.trim();
  const name = (product.product_name_en || product.product_name || "").trim();
  const n = product.nutriments ?? {};
  const kcal = offNum(n, "energy-kcal_100g");
  if (!code || name.length < 2 || kcal <= 0) return null;
  const isDrink = Boolean(n["is_beverage"]) || /\.(ml|cl|l)$/i.test(product.serving_size ?? "");
  const servingGrams = parseServing(product.serving_size);
  const declaresPiece = /\b(piece|pieces|stuk|portion)\b/i.test(product.serving_size ?? "");
  return {
    id: `off:${code}`,
    source: "off",
    name: name.slice(0, 120),
    brand: product.brands?.split(",")[0]?.trim() || null,
    imageUrl: product.image_small_url ?? null,
    ingredients: (product.ingredients_text_en || product.ingredients_text || "").slice(0, 400) || null,
    allergens: humanizeTags(product.allergens),
    servingGrams,
    pieceGrams: declaresPiece && servingGrams ? servingGrams : null,
    unit: isDrink ? "ml" : "g",
    per100: {
      kcal: Math.round(kcal),
      protein: Math.round(offNum(n, "proteins_100g") * 10) / 10,
      carbs: Math.round(offNum(n, "carbohydrates_100g") * 10) / 10,
      fat: Math.round(offNum(n, "fat_100g") * 10) / 10,
      fiber: Math.round(offNum(n, "fiber_100g") * 10) / 10,
      sugar: Math.round(offNum(n, "sugars_100g") * 10) / 10,
      sodium: Math.round(offNum(n, "sodium_100g") || offNum(n, "salt_100g") / 2.5),
    },
    barcode: code,
  };
}

export const OFF_FIELDS =
  "code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,serving_size,allergens,image_small_url,nutriments";

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

/* ---------------- OFF category browsing ---------------- */

/** Tag filter for OFF category/label browsing. */
export type OffTag = { type: "categories" | "labels"; value: string };

/**
 * OFF search restricted to tags (e.g. categories "en:rices"). One request per
 * tag, bounded to the first three, merged with dedupe. Returns [] when a tag
 * has no well-formed products — callers merge seed results on top.
 */
export async function offCategorySearch(tags: OffTag[]): Promise<NormalizedFood[]> {
  const usable = tags.slice(0, 3);
  if (!usable.length) return [];

  const perTag = await Promise.all(
    usable.map(async (tag) => {
      const param = tag.type === "categories" ? "categories_tags" : "labels_tags";
      const url = `${OFF_BASE}/cgi/search.pl?action=process&json=1&page=1&page_size=20&${param}=${encodeURIComponent(tag.value)}&fields=${OFF_FIELDS}`;
      const products = await offFetch(url).catch(() => []);
      return products.map(normalizeOff).filter((item): item is NormalizedFood => item !== null);
    }),
  );

  const seen = new Set<string>();
  const merged: NormalizedFood[] = [];
  for (const list of perTag) {
    for (const item of list) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= 24) return merged;
    }
  }
  return merged;
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
    allergens: null, // USDA publishes no allergen field.
    servingGrams: perServing <= 500 ? Math.round(perServing) : 100,
    pieceGrams: null,
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

/* ---------------- Dietly API (optional gap-filler) ---------------- */

type DietlyFood = {
  id?: number;
  name?: string;
  brand?: string | null;
  barcode?: string | null;
  serving_size_g?: number | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  image_thumb_url?: string | null;
  image_url?: string | null;
  source?: string | null;
  confidence?: number | null;
};

/**
 * Dietly normalizes several catalogs; records whose upstream source is an AI
 * estimate ("claude") or a user submission ("community") are rejected — KOVA
 * only serves off/usda-sourced Dietly rows. Requires DIETLY_API_KEY for
 * commercial use (their anonymous tier is for evaluation only).
 */
function normalizeDietly(food: DietlyFood): NormalizedFood | null {
  const upstream = (food.source ?? "").toLowerCase();
  if (upstream !== "off" && upstream !== "usda") return null;
  const name = (food.name ?? "").trim();
  const kcal = Number(food.calories_kcal);
  if (!food.id || name.length < 2 || !Number.isFinite(kcal) || kcal <= 0) return null;
  const num = (value: number | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : 0;
  };
  const servingGrams = food.serving_size_g && food.serving_size_g > 0 ? Math.round(Math.min(500, food.serving_size_g)) : null;
  return {
    id: `dietly:${food.id}`,
    source: "dietly",
    name: name.slice(0, 120),
    brand: food.brand?.trim() || null,
    imageUrl: food.image_thumb_url || food.image_url || null,
    ingredients: null,
    allergens: null,
    servingGrams,
    pieceGrams: null,
    unit: "g",
    per100: {
      kcal: Math.round(kcal),
      protein: num(food.protein_g),
      carbs: num(food.carbs_g),
      fat: num(food.fat_g),
      fiber: num(food.fiber_g),
      sugar: num(food.sugar_g),
      sodium: Math.round(Number(food.sodium_mg) || 0),
    },
    barcode: food.barcode?.trim() || null,
  };
}

function dietlyHeaders(apiKey: string | undefined): Record<string, string> {
  const headers: Record<string, string> = { "User-Agent": "KOVA AI - kovaai.dev - web app v1.0 (https://kovaai.dev)" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

export async function dietlySearchUncached(query: string, apiKey: string | undefined): Promise<NormalizedFood[]> {
  const response = await fetch(`${DIETLY_BASE}/search?q=${encodeURIComponent(query)}&limit=20`, { headers: dietlyHeaders(apiKey) });
  if (!response.ok) throw new Error(`Dietly request failed (${response.status}).`);
  const data = (await response.json()) as DietlyFood[] | { results?: DietlyFood[] };
  const list = Array.isArray(data) ? data : data.results ?? [];
  return list.map(normalizeDietly).filter((item): item is NormalizedFood => item !== null).slice(0, 12);
}

export async function dietlyBarcodeUncached(barcode: string, apiKey: string | undefined): Promise<NormalizedFood | null> {
  const response = await fetch(`${DIETLY_BASE}/barcode/${encodeURIComponent(barcode)}`, { headers: dietlyHeaders(apiKey) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Dietly request failed (${response.status}).`);
  const data = (await response.json()) as DietlyFood | null;
  return data ? normalizeDietly(data) : null;
}

/* ---------------- Cross-database matching (AI scanner) ---------------- */

/**
 * Best-effort match of a plain food name (e.g. from the AI scanner) against
 * the databases. Generic foods prefer USDA (reference values), packaged foods
 * prefer OFF. Returns null when no database has the food — callers must NOT
 * invent values in that case.
 */
export async function matchFoodByName(query: string, usdaApiKey: string | undefined): Promise<NormalizedFood | null> {
  const corrected = correctQuery(query).slice(0, 80);
  if (corrected.length < 2) return null;
  if (usdaApiKey) {
    try {
      const usda = await usdaSearchUncached(corrected, usdaApiKey);
      if (usda.length) return usda[0];
    } catch {
      // Fall through to OFF.
    }
  }
  try {
    const off = await offSearchUncached(corrected);
    if (off.length) return off[0];
  } catch {
    // Fall through to Dietly.
  }
  try {
    const dietly = await dietlySearchUncached(corrected, process.env.DIETLY_API_KEY);
    return dietly[0] ?? null;
  } catch {
    return null;
  }
}
