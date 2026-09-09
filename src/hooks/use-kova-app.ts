import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type PlanDay = Database["public"]["Tables"]["plan_days"]["Row"];
export type PlanExercise = Database["public"]["Tables"]["plan_exercises"]["Row"];
export type CompletedSet = Database["public"]["Tables"]["completed_sets"]["Row"];

type PlanInsert = Database["public"]["Tables"]["plans"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type PlanDayInsert = Database["public"]["Tables"]["plan_days"]["Insert"];
type PlanExerciseInsert = Database["public"]["Tables"]["plan_exercises"]["Insert"];
type CompletedSetInsert = Database["public"]["Tables"]["completed_sets"]["Insert"];

export function useKovaProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (result.error) setError(result.error.message);
    else setProfile(result.data);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(async (changes: ProfileUpdate) => {
    if (!supabase || !userId) throw new Error("You must be signed in.");
    const result = await supabase.from("profiles").upsert({ id: userId, ...changes }, { onConflict: "id" }).select().single();
    if (result.error) throw result.error;
    setProfile(result.data);
    return result.data;
  }, [userId]);

  return { profile, isLoading, error, reload: load, update };
}

export function useKovaPlans(userId: string | undefined) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setPlans([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase.from("plans").select("*").eq("user_id", userId).neq("status", "archived").order("updated_at", { ascending: false });
    if (result.error) setError(result.error.message);
    else setPlans(result.data ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const createPlan = useCallback(async (plan: Omit<PlanInsert, "user_id">) => {
    if (!supabase || !userId) throw new Error("You must be signed in.");
    const result = await supabase.from("plans").insert({ ...plan, user_id: userId }).select().single();
    if (result.error) throw result.error;
    setPlans((current) => [result.data, ...current]);
    return result.data;
  }, [userId]);

  return { plans, isLoading, error, reload: load, createPlan };
}

export function useKovaPlanDays(planId: string | undefined, userId: string | undefined) {
  const [days, setDays] = useState<PlanDay[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(planId && userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !planId || !userId) {
      setDays([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase
      .from("plan_days")
      .select("*")
      .eq("plan_id", planId)
      .order("day_of_week", { ascending: true });
    if (result.error) setError(result.error.message);
    else setDays(result.data ?? []);
    setIsLoading(false);
  }, [planId, userId]);

  useEffect(() => { void load(); }, [load]);

  const addDay = useCallback(async (day: Omit<PlanDayInsert, "plan_id">) => {
    if (!supabase || !planId || !userId) throw new Error("You must be signed in.");
    const result = await supabase.from("plan_days").insert({ ...day, plan_id: planId }).select().single();
    if (result.error) throw result.error;
    setDays((current) => [...current, result.data].sort((a, b) => a.day_of_week - b.day_of_week));
    return result.data;
  }, [planId, userId]);

  return { days, isLoading, error, reload: load, addDay };
}

export function useKovaPlanExercises(planDayId: string | undefined, userId: string | undefined) {
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(planDayId && userId));
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!supabase || !planDayId || !userId) { setExercises([]); setIsLoading(false); return; }
    setIsLoading(true);
    const result = await supabase.from("plan_exercises").select("*").eq("plan_day_id", planDayId).order("sort_order", { ascending: true });
    if (result.error) setError(result.error.message); else setExercises(result.data ?? []);
    setIsLoading(false);
  }, [planDayId, userId]);
  useEffect(() => { void load(); }, [load]);
  const addExercise = useCallback(async (exercise: Omit<PlanExerciseInsert, "plan_day_id">) => {
    if (!supabase || !planDayId || !userId) throw new Error("You must be signed in.");
    const result = await supabase.from("plan_exercises").insert({ ...exercise, plan_day_id: planDayId }).select().single();
    if (result.error) throw result.error;
    setExercises((current) => [...current, result.data].sort((a, b) => a.sort_order - b.sort_order));
    return result.data;
  }, [planDayId, userId]);
  return { exercises, isLoading, error, reload: load, addExercise };
}

export function useCompletedSets(userId: string | undefined) {
  const [sets, setSets] = useState<CompletedSet[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const load = useCallback(async () => {
    if (!supabase || !userId) { setSets([]); setIsLoading(false); return; }
    setIsLoading(true);
    const result = await supabase.from("completed_sets").select("*").eq("user_id", userId).order("completed_at", { ascending: false });
    if (!result.error) setSets(result.data ?? []);
    setIsLoading(false);
  }, [userId]);
  useEffect(() => { void load(); }, [load]);
  const completeSet = useCallback(async (set: Omit<CompletedSetInsert, "user_id">) => {
    if (!supabase || !userId) throw new Error("You must be signed in.");
    const result = await supabase.from("completed_sets").insert({ ...set, user_id: userId }).select().single();
    if (result.error) throw result.error;
    setSets((current) => [result.data, ...current]);
    return result.data;
  }, [userId]);
  return { sets, isLoading, reload: load, completeSet };
}
