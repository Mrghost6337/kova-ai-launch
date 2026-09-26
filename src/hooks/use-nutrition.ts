import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type NutritionTarget = Database["public"]["Tables"]["nutrition_targets"]["Row"];
export type NutritionTargetInput = Omit<Database["public"]["Tables"]["nutrition_targets"]["Insert"], "user_id">;
export type FoodEntry = Database["public"]["Tables"]["food_entries"]["Row"];
export type FoodEntryInsert = Database["public"]["Tables"]["food_entries"]["Insert"];

/** Today's date as YYYY-MM-DD in local time (matches the `date` column). */
export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Mifflin-St Jeor BMR + activity factor, adjusted by goal. */
export function computeTargets(input: {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "athlete";
  goal: "lose_fat" | "maintain" | "build_muscle";
}) {
  const bmr =
    input.sex === "male"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
  const tdee = bmr * factors[input.activity];
  const calories = Math.round(input.goal === "lose_fat" ? tdee - 450 : input.goal === "build_muscle" ? tdee + 250 : tdee);
  // Protein: 1.8 g/kg on a cut, 2.0 g/kg otherwise; fat 25% of calories; carbs fill the rest.
  const proteinPerKg = input.goal === "lose_fat" ? 2.2 : 1.8;
  const protein = Math.round(input.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calorie_target: calories, protein_target: protein, carb_target: carbs, fat_target: fat };
}

export function useNutritionTargets(userId: string | undefined) {
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setTargets(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase.from("nutrition_targets").select("*").eq("user_id", userId).maybeSingle();
    if (result.error) setError(result.error.message);
    else setTargets(result.data);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (input: NutritionTargetInput) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const result = await supabase
        .from("nutrition_targets")
        .upsert({ ...input, user_id: userId }, { onConflict: "user_id" })
        .select()
        .single();
      if (result.error) throw result.error;
      setTargets(result.data);
      return result.data;
    },
    [userId],
  );

  return { targets, isLoading, error, reload: load, save };
}

export function useFoodEntries(userId: string | undefined, date: string) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("logged_date", date)
      .order("created_at", { ascending: true });
    if (result.error) setError(result.error.message);
    else setEntries(result.data ?? []);
    setIsLoading(false);
  }, [userId, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const addEntry = useCallback(
    async (entry: Omit<FoodEntryInsert, "user_id" | "logged_date">) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const result = await supabase
        .from("food_entries")
        .insert({ source: "search", ...entry, user_id: userId, logged_date: date })
        .select()
        .single();
      if (result.error) throw result.error;
      setEntries((current) => [...current, result.data]);
      return result.data;
    },
    [userId, date],
  );

  const updateEntry = useCallback(
    async (entryId: string, changes: Database["public"]["Tables"]["food_entries"]["Update"]) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const result = await supabase
        .from("food_entries")
        .update(changes)
        .eq("id", entryId)
        .eq("user_id", userId)
        .select()
        .single();
      if (result.error) throw result.error;
      setEntries((current) => current.map((entry) => (entry.id === entryId ? result.data : entry)));
      return result.data;
    },
    [userId],
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      // Optimistic removal so totals and the list update instantly.
      let removed: FoodEntry | undefined;
      setEntries((current) => {
        removed = current.find((entry) => entry.id === entryId);
        return current.filter((entry) => entry.id !== entryId);
      });
      const result = await supabase.from("food_entries").delete().eq("id", entryId).eq("user_id", userId);
      if (result.error) {
        // Roll back so the UI never loses a row the database still has.
        if (removed) setEntries((current) => [...current, removed as FoodEntry].sort((a, b) => a.created_at.localeCompare(b.created_at)));
        throw result.error;
      }
    },
    [userId],
  );

  return { entries, isLoading, error, reload: load, addEntry, updateEntry, removeEntry };
}

/**
 * Lightweight food history used for "foods you eat often" suggestions.
 * Reads only the user's own rows via RLS; ranks by frequency, most recent first.
 */
export function useFoodHistory(userId: string | undefined, limit = 12) {
  const [items, setItems] = useState<FoodEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !userId) {
      setItems([]);
      return;
    }
    void supabase
      .from("food_entries")
      .select("name, image_url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(150)
      .then(({ data }: { data: Array<{ name: string; image_url: string | null }> | null }) => {
        if (cancelled) return;
        const counts = new Map<string, { count: number; image_url: string | null }>();
        for (const row of data ?? []) {
          const key = row.name.trim().toLowerCase();
          const existing = counts.get(key);
          if (existing) existing.count += 1;
          else counts.set(key, { count: 1, image_url: row.image_url });
        }
        const ranked = [...counts.entries()]
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, limit)
          .map(([name, meta]) => ({ name: name.replace(/\s*[x×]\d+$/i, ""), image_url: meta.image_url, count: meta.count }));
        setItems(ranked as unknown as FoodEntry[]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  return items;
}

/** A short, honest daily insight computed from real logged data. */
export function buildInsight(targets: NutritionTarget | null, entries: FoodEntry[]): string | null {
  if (!entries.length) return null;
  const totals = entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein_g,
      carbs: sum.carbs + entry.carbs_g,
      fat: sum.fat + entry.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const meals = new Set(entries.map((entry) => entry.meal)).size;
  if (targets) {
    const proteinGap = targets.protein_target - totals.protein;
    if (proteinGap > 0 && proteinGap >= 20) return `You are ${proteinGap} g below your protein target.`;
    if (totals.calories > targets.calorie_target * 1.02) return `You are ${totals.calories - targets.calorie_target} kcal over today's target.`;
    if (targets.calorie_target - totals.calories <= Math.round(targets.calorie_target * 0.08)) return "Your calories are close to today's target.";
  }
  if (meals >= 3) return `You've logged ${meals} meals today — ${totals.calories.toLocaleString()} kcal in total.`;
  return `You've logged ${totals.calories.toLocaleString()} kcal so far today.`;
}
