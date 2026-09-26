"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { FOOD101_DISHES } from "./food101Dishes";
import { matchFoodByName } from "./foodProviders";

/**
 * AI food scanner for the KOVA Food page ("Scan with AI").
 *
 * Pipeline:
 *   1. Photo → open-weights vision model (default Qwen2.5-VL via OpenRouter,
 *      configurable with FOOD_VISION_MODEL) identifies foods and estimates
 *      portions. The model is used for RECOGNITION ONLY — it never outputs
 *      nutrition numbers.
 *   2. Each detected food is matched against Open Food Facts (primary) and
 *      USDA FoodData Central (requires USDA_API_KEY).
 *   3. Nutrition is computed from the matched database values scaled by the
 *      estimated grams. Items with no database match are returned with
 *      matched: false and zero values — the user edits them manually or
 *      removes them. Nothing is invented here; nothing is stored.
 *
 * FoodLMM (https://github.com/YuehaoYin/FoodLMM) was evaluated as the primary
 * recognizer but requires a CUDA GPU (LISA-7B + SAM ViT-H, flash-attn,
 * deepspeed) and ships no hosted inference API or license file, so it cannot
 * run on this infrastructure. Per the project rule the integration is not
 * faked: the same interface is fulfilled by an open-weights vision model
 * served through OpenRouter (Qwen2.5-VL by default, Apache-2.0 weights).
 *
 * Food-101 is used as a dish-name vocabulary (reference only) to steer the
 * recognizer toward consistent dish names.
 */

const DEFAULT_VISION_MODEL = "qwen/qwen2.5-vl-72b-instruct";

const DISH_VOCABULARY = FOOD101_DISHES.join(", ");

const SYSTEM_PROMPT = `You are a food recognition engine inside a fitness app. You receive one photo of a meal.

Your job is ONLY to identify the foods and estimate portion sizes. You do NOT provide nutrition values — the app looks those up in real food databases (Open Food Facts / USDA).

Rules:
- List each distinct food item you can see.
- For each item, estimate the portion in grams from visual cues (plate size, cutlery, packaging). For drinks, give the amount in ml as the grams value.
- Use short, generic food names a food database would know (e.g. "chicken breast", "white rice", "greek yogurt", "fried rice", "caesar salad").
- When the photo shows a prepared dish, prefer these common dish names where they match: ${DISH_VOCABULARY}.
- If you cannot tell what something is, still list it with your best generic name and a low confidence.
- If the photo contains no food or is unreadable, return items: [] and set note to a short reason.
- Never output calories or macronutrients.
- Answer with JSON only, exactly: {"items": [{"name": string, "grams": number, "confidence": number}], "note": string}`;

type DetectedItem = { name: string; grams: number; confidence: number };

type DetectedFoodItem = {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence: number;
  matched: boolean;
  imageUrl: string | null;
};

type AnalysisResult = { items: DetectedFoodItem[]; note: string };

function clampItem(raw: unknown): DetectedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name.trim().slice(0, 80) : "";
  if (!name) return null;
  return {
    name,
    grams: Math.max(0, Math.min(5000, Math.round(Number(item.grams) || 0))),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
  };
}

function parseAnalysis(content: string): { items: DetectedItem[]; note: string } {
  // Tolerate models that wrap JSON in code fences.
  const cleaned = content.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The AI response could not be read. Try again.");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  const items = Array.isArray(parsed.items) ? parsed.items.map(clampItem).filter((item): item is DetectedItem => item !== null) : [];
  return { items: items.slice(0, 12), note: typeof parsed.note === "string" ? parsed.note.slice(0, 240) : "" };
}

export const analyzeMeal = action({
  args: {
    imageBase64: v.string(), // Raw base64 (no data: prefix)
    mimeType: v.string(), // e.g. image/jpeg
    mealHint: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(
      v.object({
        name: v.string(),
        grams: v.number(),
        calories: v.number(),
        protein_g: v.number(),
        carbs_g: v.number(),
        fat_g: v.number(),
        fiber_g: v.number(),
        sugar_g: v.number(),
        sodium_mg: v.number(),
        confidence: v.number(),
        matched: v.boolean(),
        imageUrl: v.union(v.string(), v.null()),
      }),
    ),
    note: v.string(),
  }),
  handler: async (ctx, args): Promise<AnalysisResult> => {
    await getAuthUserId(ctx).then((userId) => {
      if (!userId) throw new Error("You need to be signed in to scan food.");
    });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Food scanning is not configured yet. Add an OPENROUTER_API_KEY in the project settings to enable it.",
      );
    }

    if (!args.imageBase64 || args.imageBase64.length > 7_000_000) {
      throw new Error("That image is too large. Try a smaller photo.");
    }

    const model = process.env.FOOD_VISION_MODEL || DEFAULT_VISION_MODEL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    let recognized: { items: DetectedItem[]; note: string };
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kovaai.dev",
          "X-Title": "KOVA AI",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: args.mealHint ? `Identify the foods in this photo. The user says this is for: ${args.mealHint}.` : "Identify the foods in this photo and estimate each portion." },
                { type: "image_url", image_url: { url: `data:${args.mimeType};base64,${args.imageBase64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 900,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        if (response.status === 401 || response.status === 403) throw new Error("The food scanner is temporarily unavailable (authentication). Try again later.");
        if (response.status === 429) throw new Error("The food scanner is busy right now. Wait a moment and try again.");
        throw new Error(`Food analysis failed (${response.status}). ${detail.slice(0, 140)}`.trim());
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("The AI returned an empty response. Try again.");
      recognized = parseAnalysis(content);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("The analysis timed out. Check your connection and try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!recognized.items.length) {
      throw new Error(recognized.note || "KOVA could not detect any food in this photo. Try a clearer, well-lit photo of the meal.");
    }

    // Match every recognized food against the real nutrition databases.
    const usdaApiKey = process.env.USDA_API_KEY;
    const items: DetectedFoodItem[] = await Promise.all(
      recognized.items.map(async (item): Promise<DetectedFoodItem> => {
        const food = await matchFoodByName(item.name, usdaApiKey).catch(() => null);
        if (!food) {
          // No database match: return zeros and let the user edit or remove.
          return { name: item.name, grams: item.grams, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, confidence: item.confidence, matched: false, imageUrl: null };
        }
        const factor = Math.max(0, item.grams) / 100;
        const r = (value: number) => Math.round(value * factor);
        return {
          name: item.name,
          grams: item.grams,
          calories: r(food.per100.kcal),
          protein_g: r(food.per100.protein),
          carbs_g: r(food.per100.carbs),
          fat_g: r(food.per100.fat),
          fiber_g: r(food.per100.fiber),
          sugar_g: r(food.per100.sugar),
          sodium_mg: r(food.per100.sodium),
          confidence: item.confidence,
          matched: true,
          imageUrl: food.imageUrl,
        };
      }),
    );

    const matchedCount = items.filter((item) => item.matched).length;
    const note = matchedCount < items.length
      ? `${matchedCount} of ${items.length} foods matched a nutrition database. Items without a match need manual values.`
      : recognized.note;

    return { items, note };
  },
});
