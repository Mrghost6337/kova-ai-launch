import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Dumbbell, Pencil, Search, Sparkles, X } from "lucide-react";
import { Link, useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useKovaPlanDays, useKovaPlanExercises, type Plan } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { exerciseGifUrl, loadExercises, searchExercises, type Exercise } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";

const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PlanDetail() {
  const { id } = useParams();
  const { user } = useSupabaseAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { days, addDay } = useKovaPlanDays(id, user?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>();
  const { exercises, addExercise } = useKovaPlanExercises(selectedDayId, user?.id);
  const [addingDay, setAddingDay] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [dayError, setDayError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);

  useEffect(() => {
    if (!supabase || !user?.id || !id) { setIsLoading(false); return; }
    void supabase.from("plans").select("*").eq("id", id).eq("user_id", user.id).maybeSingle().then((result) => {
      if (result.error) setError(result.error.message);
      setPlan(result.data);
      setIsLoading(false);
    });
  }, [id, user?.id]);

  useEffect(() => {
    if (!selectedDayId && days[0]) setSelectedDayId(days[0].id);
  }, [days, selectedDayId]);

  const selectedDay = days.find((day) => day.id === selectedDayId);
  const exerciseResults = useMemo(() => searchExercises(catalog, exerciseQuery).slice(0, 12), [catalog, exerciseQuery]);

  const saveDay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dayTitle.trim()) return;
    setDayError(null);
    try {
      const created = await addDay({ day_of_week: dayIndex, title: dayTitle.trim(), is_rest_day: false, duration_minutes: null, notes: null });
      setSelectedDayId(created.id);
      setDayTitle("");
      setAddingDay(false);
    } catch (cause) { setDayError(cause instanceof Error ? cause.message : "Could not save this day."); }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    if (catalog.length || catalogError) return;
    try { setCatalog(await loadExercises()); }
    catch (cause) { setCatalogError(cause instanceof Error ? cause.message : "Could not load exercises."); }
  };

  const selectExercise = async (exercise: Exercise) => {
    if (!selectedDayId) return;
    setAddingExercise(true);
    try {
      await addExercise({ exercise_id: exercise.id, exercise_name: exercise.name, sort_order: exercises.length, sets: 3, reps: "8-12", rest_seconds: 90, notes: null });
      setPickerOpen(false);
    } catch (cause) { setCatalogError(cause instanceof Error ? cause.message : "Could not add this exercise."); }
    finally { setAddingExercise(false); }
  };

  return <AppShell>
    <Seo title={`${plan?.name ?? "Plan"} — KOVA AI`} description="Your KOVA AI training plan." path={`/dashboard/plan/${id ?? ""}`} />
    <div className="mx-auto max-w-6xl">
      <Link to="/dashboard/plan" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />All plans</Link>
      {isLoading ? <p className="mt-12 text-sm text-white/40">Loading your plan…</p> : error ? <p className="mt-12 text-sm text-red-200">Could not load this plan: {error}</p> : !plan ? <div className="mt-12 rounded-2xl border border-white/10 p-8 text-white/55">This plan could not be found.</div> : <>
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{plan.source === "ai" ? "KOVA draft" : "Manual plan"} · {plan.status}</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">{plan.name}.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-white/45">Your answers are saved securely. Add days and exercises as your plan takes shape.</p></div><button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]"><Pencil className="size-4" />Edit plan</button></div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 lg:col-span-2"><div className="flex items-center gap-3"><CalendarDays className="size-5 text-white/50" /><h2 className="font-serif text-3xl italic">Weekly plan</h2></div><div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{week.map((day, index) => { const savedDay = days.find((candidate) => candidate.day_of_week === index); return <button type="button" key={day} onClick={() => savedDay && setSelectedDayId(savedDay.id)} className={`rounded-2xl border p-4 text-left transition-colors ${savedDay?.id === selectedDayId ? "border-white/35 bg-white/[0.1]" : "border-white/[0.08] bg-black/20 hover:bg-white/[0.05]"}`}><p className="text-xs text-white/65">{day}</p><p className="mt-3 text-xs text-white/45">{savedDay?.title ?? "No workout added"}</p></button>; })}</div><button type="button" onClick={() => setAddingDay(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"><Dumbbell className="size-4" />Add workout day</button>{addingDay && <form onSubmit={saveDay} className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#0b0b0b] px-3 text-sm text-white">{week.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input value={dayTitle} onChange={(event) => setDayTitle(event.target.value)} placeholder="Workout name" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/25" /><button type="submit" className="h-11 rounded-xl bg-white px-4 text-xs font-semibold text-black">Save</button>{dayError && <p className="text-xs text-red-200 sm:col-span-3">{dayError}</p>}</form>}</section>
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><Sparkles className="size-5 text-white/50" /><h2 className="mt-7 font-serif text-3xl italic">Next step</h2><p className="mt-3 text-sm leading-6 text-white/40">This is a saved draft. Add your first workout day and exercises when you are ready.</p><Link to="/dashboard/plan" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Continue setup <CheckCircle2 className="size-4" /></Link></section>
        </div>
        <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-3"><Dumbbell className="size-5 text-white/50" /><h2 className="font-serif text-3xl italic">{selectedDay?.title ?? "Exercises"}</h2></div><p className="mt-2 text-sm text-white/40">{selectedDay ? "Build this session from the real exercise catalog." : "Add a workout day first."}</p></div>{selectedDay && <button type="button" onClick={() => void openPicker()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black"><Dumbbell className="size-4" />Add exercise</button>}</div>{exercises.length ? <div className="mt-7 space-y-2">{exercises.map((exercise, index) => <div key={exercise.id} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center gap-3"><span className="text-xs text-white/30">0{index + 1}</span><div><p className="text-sm capitalize text-white/75">{exercise.exercise_name}</p><p className="mt-1 text-xs text-white/35">{exercise.sets} sets · {exercise.reps} reps · {exercise.rest_seconds ?? "—"} sec rest</p></div></div><Check className="size-4 text-white/35" /></div>)}</div> : <p className="mt-7 text-sm leading-7 text-white/40">No exercises have been added yet. KOVA will only show exercise data once it is selected for this plan.</p>}</section>
      </>}
    </div>
    {pickerOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-5 backdrop-blur-md"><div className="liquid-glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border-white/15 bg-[#0b0b0b] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Exercise catalog</p><h2 className="mt-3 font-serif text-4xl italic">Choose a movement.</h2></div><button type="button" onClick={() => setPickerOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white" aria-label="Close exercise picker"><X className="size-4" /></button></div><label className="relative mt-7 block"><Search className="absolute left-4 top-3.5 size-4 text-white/35" /><input value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Search by name, muscle or equipment" className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" /></label>{catalogError && <p className="mt-4 text-sm text-red-200">{catalogError}</p>}{!catalog.length && !catalogError ? <p className="mt-8 text-sm text-white/40">Loading the exercise catalog…</p> : <div className="mt-6 grid gap-2">{exerciseResults.map((exercise) => <button type="button" key={exercise.id} disabled={addingExercise} onClick={() => void selectExercise(exercise)} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 text-left transition-colors hover:bg-white/[0.08] disabled:opacity-50"><img loading="lazy" src={exerciseGifUrl(exercise)} alt="" className="size-14 rounded-xl object-cover" /><span><span className="block text-sm capitalize text-white/75">{exercise.name}</span><span className="mt-1 block text-xs capitalize text-white/35">{exercise.targetMuscles.join(" · ")} · {exercise.equipment.join(", ")}</span></span></button>)}</div>}<p className="mt-6 text-[10px] leading-5 text-white/25">Metadata and demonstrations are loaded on demand from the exercise-library repository. Verify its applicable license before commercial distribution.</p></div></div>}
  </AppShell>;
}
