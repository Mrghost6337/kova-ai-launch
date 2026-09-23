"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * AI food scanner (mobile Food page).
 *
 * The user's food photo is sent to a vision model through OpenRouter. The API
 * key is read from Convex environment variables (OPENROUTER_API_KEY) and never
 * reaches the browser. The model must answer in strict JSON so the client can
 * render editable results before anything is saved — nothing is stored here.
 */

const MODEL = "google/gemini-2.0-flash-001";

const SYSTEM_PROMPT = `You are a nutrition analysis engine inside a fitness app. You receive one photo of a meal and estimate its contents.

Rules:
- Identify each distinct food item. Estimate the portion in grams from visual cues (plate size, cutlery, packaging).
- Estimate calories, protein, carbohydrates and fat per item using standard nutrition data. Use plausible values for typical preparations; never invent brand names you cannot see.
- If the photo contains no food, is not readable, or you cannot identify anything, return items: [] and set note to a short reason.
- Confidence (0-1) reflects how sure you are about the identification and portion.
- Answer with JSON only, matching the requested schema exactly. No markdown, no extra text.`;

const userPrompt = "Analyze this meal photo. Return the detected food items with estimated grams, kcal, protein, carbs and fat for each.";

type DetectedItem = {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
};

type AnalysisResult = { items: DetectedItem[]; note: string };

function clampItem(raw: unknown): DetectedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name.trim().slice(0, 80) : "";
  if (!name) return null;
  const num = (value: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  return {
    name,
    grams: num(item.grams, 5000),
    calories: num(item.calories, 5000),
    protein_g: num(item.protein_g ?? item.protein, 500),
    carbs_g: num(item.carbs_g ?? item.carbs, 800),
    fat_g: num(item.fat_g ?? item.fat, 300),
    confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
  };
}

function parseAnalysis(content: string): AnalysisResult {
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("You need to be signed in to scan food.");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Food scanning is not configured yet. Add an OPENROUTER_API_KEY in the project settings to enable it.",
      );
    }

    if (!args.imageBase64 || args.imageBase64.length > 7_000_000) {
      throw new Error("That image is too large. Try a smaller photo.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
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
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: args.mealHint ? `${userPrompt} The user says this is for: ${args.mealHint}.` : userPrompt },
                { type: "image_url", image_url: { url: `data:${args.mimeType};base64,${args.imageBase64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 1200,
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

      const result = parseAnalysis(content);
      if (!result.items.length) {
        throw new Error(result.note || "KOVA could not detect any food in this photo. Try a clearer, well-lit photo of the meal.");
      }
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("The analysis timed out. Check your connection and try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
});
