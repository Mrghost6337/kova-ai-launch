import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useCallback, useState } from "react";

export type DetectedFood = {
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
  /** False when no OFF/USDA match was found — values are then zero and editable. */
  matched: boolean;
  imageUrl: string | null;
};

/**
 * Runs the Scan-with-AI pipeline through the Convex backend: the vision model
 * recognizes foods, nutrition values come from Open Food Facts / USDA.
 */
export function useFoodAi() {
  const analyze = useAction(api.food.analyzeMeal);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMeal = useCallback(
    async (file: File, mealHint?: string): Promise<{ items: DetectedFood[]; note: string }> => {
      setIsAnalyzing(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read that photo."));
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(",")[1] ?? "";
        const mimeType = dataUrl.slice(5, dataUrl.indexOf(";")) || "image/jpeg";
        return await analyze({ imageBase64: base64, mimeType, mealHint });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyze],
  );

  return { analyzeMeal, isAnalyzing };
}
