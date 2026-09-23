import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useKovaPlans } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { generatePlanBlueprint } from "@/lib/plan-generator";
import { toast } from "sonner";

const questions = [
  { key: "experience", title: "Where are you starting?", explanation: "This helps KOVA choose a sensible starting point. You do not need to know training science.", options: ["Complete beginner", "Some experience", "Intermediate", "Advanced", "I don't know"] },
  { key: "regularity", title: "Do you train regularly today?", explanation: "KOVA uses your current routine to make the first week realistic.", options: ["Not yet", "Sometimes", "Most weeks", "I don't know"] },
  { key: "location", title: "Where do you train?", explanation: "Your training space tells KOVA which movements can realistically fit your plan.", options: ["Gym", "Home", "Home + Gym", "No equipment / bodyweight"] },
  { key: "equipment", title: "What equipment can you use?", explanation: "List equipment you know you can access. KOVA will not assume anything you do not provide.", options: [] },
  { key: "availability", title: "How often can you train?", explanation: "A plan should fit your real week, not an ideal week.", options: ["2 days", "3 days", "4 days", "5 days", "6+ days", "I don't know"] },
  { key: "days", title: "Which days usually work?", explanation: "Choose the days that are most realistic for you. You can name them or skip this.", options: [] },
  { key: "time", title: "When do you usually train?", explanation: "This helps KOVA keep your plan practical. It is optional.", options: ["Morning", "Afternoon", "Evening", "It changes"] },
  { key: "duration", title: "How long can each workout be?", explanation: "KOVA should fit inside your available time.", options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes", "Custom", "I don't know"] },
  { key: "goal", title: "What do you want to work toward?", explanation: "KOVA uses your main goal to shape the direction of your plan.", options: ["Build muscle", "Lose fat", "Get stronger", "General fitness", "Improve health", "Improve endurance", "Athletic performance", "I don't know"] },
  { key: "timeline", title: "What would you like to achieve over the next few months?", explanation: "A few words help make your plan feel personal. You can skip this.", options: [] },
  { key: "age", title: "How old are you?", explanation: "Age can help KOVA keep recommendations appropriate. You can choose not to share it.", options: [] },
  { key: "body", title: "Height and weight?", explanation: "These are optional context for useful planning. KOVA does not need them to help you start.", options: [] },
  { key: "preferences", title: "What exercises do you enjoy or dislike?", explanation: "Your preferences help the plan feel like yours. You can skip this.", options: [] },
  { key: "priority", title: "Anything you want to prioritize?", explanation: "Tell KOVA which areas or training styles matter to you.", options: [] },
  { key: "limitations", title: "Any movements or limitations to know about?", explanation: "Share what you cannot or do not want to do. KOVA does not diagnose medical conditions.", options: [] },
  { key: "nutrition", title: "What should nutrition support?", explanation: "This helps connect Food to your plan. You can skip it and add details later.", options: ["Build muscle", "Lose fat", "Maintain", "General health", "I don't know"] },
  { key: "diet", title: "Any food preferences or meal preferences?", explanation: "Tell KOVA what you like, avoid or prefer. No diet is assumed.", options: [] },
] as const;

const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Mode = "ai" | "manual";

export default function Plan() {
  const { user } = useSupabaseAuth();
  const { plans, isLoading, error, createPlan, deletePlan } = useKovaPlans(user?.id);
  const [params] = useSearchParams();
  const [creating, setCreating] = useState(params.get("create") === "1");
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualDays, setManualDays] = useState<number[]>([]);
  const [manualWorkoutTitle, setManualWorkoutTitle] = useState("");
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const question = questions[step];

  const setAnswer = (value: string) => {
    if (question) setAnswers((current) => ({ ...current, [question.key]: value }));
  };

  const savePlan = async (nextAnswers = answers) => {
    setSaving(true);
    setSaveError(null);
    try {
      const plan = await createPlan({
        name: nextAnswers.name || (nextAnswers.goal ? `${nextAnswers.goal} plan` : "My first KOVA plan"),
        source: mode ?? "ai",
        status: "draft",
        onboarding_answers: nextAnswers,
      });
      navigate(`/dashboard/plan/${plan.id}`);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not save your plan.");
    } finally {
      setSaving(false);
    }
  };

  // The AI flow: generate a real, complete plan from the answers — days, workout
  // titles, and catalog exercises with sets/reps/rest — then save it all.
  const saveAiPlan = async () => {
    setSaving(true);
    setSaveError(null);
    setStage("Reading the exercise catalog…");
    try {
      const blueprint = await generatePlanBlueprint(answers);
      setStage("Building your weekly schedule…");
      if (!blueprint.days.length) throw new Error("KOVA could not build a plan from these answers. Try adjusting your equipment answers.");
      if (!supabase) throw new Error("Supabase is not configured.");
      const plan = await createPlan({
        name: blueprint.name,
        source: "ai",
        status: "draft",
        onboarding_answers: answers,
      });
      setStage("Writing your workout days…");
      const dayRows = await supabase
        .from("plan_days")
        .insert(
          blueprint.days.map((day) => ({
            plan_id: plan.id,
            day_of_week: day.dayOfWeek,
            title: day.title,
            is_rest_day: false,
            duration_minutes: day.durationMinutes,
            notes: day.focus,
          })),
        )
        .select();
      if (dayRows.error) throw dayRows.error;
      const createdDays = dayRows.data ?? [];
      setStage("Filling in exercises…");
      const exerciseRows = blueprint.days.flatMap((day, dayIndex) =>
        day.exercises.map((item, exerciseIndex) => ({
          plan_day_id: createdDays[dayIndex]?.id,
          exercise_id: item.exercise.id,
          exercise_name: item.exercise.name,
          sort_order: exerciseIndex,
          sets: item.sets,
          reps: item.reps,
          rest_seconds: item.restSeconds,
          notes: item.note ?? null,
        })),
      );
      const validRows = exerciseRows.filter((row): row is typeof row & { plan_day_id: string } => Boolean(row.plan_day_id));
      if (validRows.length) {
        const exerciseResult = await supabase.from("plan_exercises").insert(validRows);
        if (exerciseResult.error) throw exerciseResult.error;
      }
      toast(`Plan created — ${validRows.length} exercises across ${createdDays.length} days.`);
      navigate(`/dashboard/plan/${plan.id}`);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not generate your plan.");
      setSaving(false);
      setStage(null);
    }
  };

  const saveManualPlan = async () => {
    if (!manualName.trim()) {
      setSaveError("Give your plan a name so you can find it later.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const plan = await createPlan({ name: manualName.trim(), source: "manual", status: "draft", onboarding_answers: {} });
      if (manualDays.length && supabase) {
        const title = manualWorkoutTitle.trim() || "Workout";
        const result = await supabase.from("plan_days").insert(
          manualDays.map((day) => ({ plan_id: plan.id, day_of_week: day, title, is_rest_day: false, duration_minutes: null, notes: null })),
        );
        if (result.error) throw result.error;
      }
      navigate(`/dashboard/plan/${plan.id}`);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not save your plan.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await deletePlan(planToDelete);
      toast("Plan deleted.");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Could not delete this plan.");
    } finally {
      setDeleting(false);
      setPlanToDelete(null);
    }
  };

  const toggleManualDay = (index: number) => {
    setManualDays((current) => (current.includes(index) ? current.filter((day) => day !== index) : [...current, index].sort((a, b) => a - b)));
  };

  if (creating) {
    return (
      <AppShell>
        <Seo title="Create a plan — KOVA AI" description="Create a personal KOVA AI training plan." path="/dashboard/plan" />
        <div className="mx-auto max-w-2xl">
          <button type="button" onClick={() => { if (!mode) setCreating(false); else if (mode === "ai" && step > 0) setStep((value) => value - 1); else setMode(null); }} className="mb-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />Back</button>
          {!mode ? (
            <>
              <p className="eyebrow">Plan maker</p>
              <h1 className="mt-4 font-serif text-5xl italic tracking-[-0.07em] sm:text-6xl">How should we start?</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">Choose a starting point. Both options stay editable, and nothing is generated until you confirm.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => setMode("ai")} className="liquid-glass rounded-[1.5rem] border-white/15 bg-white/[0.06] p-6 text-left transition-transform hover:-translate-y-1"><Sparkles className="size-5 text-white/70" /><h2 className="mt-8 font-serif text-3xl italic">Create with AI</h2><p className="mt-3 text-sm leading-6 text-white/45">Answer a few simple questions progressively. Skip anything you do not know.</p><span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">Start <ArrowRight className="size-4" /></span></button>
                <button type="button" onClick={() => setMode("manual")} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 text-left transition-colors hover:bg-white/[0.05]"><Dumbbell className="size-5 text-white/55" /><h2 className="mt-8 font-serif text-3xl italic">Create manually</h2><p className="mt-3 text-sm leading-6 text-white/45">Name your plan, pick your training days and start building workouts instantly.</p><span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">Start <ArrowRight className="size-4" /></span></button>
              </div>
            </>
          ) : mode === "manual" ? (
            <>
              <p className="eyebrow">Manual plan</p>
              <h1 className="mt-5 font-serif text-5xl italic tracking-[-0.07em]">Name your plan.</h1>
              <p className="mt-4 text-sm leading-7 text-white/45">Pick the days you want to train. You can add or change everything later.</p>
              <input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="e.g. My strength plan" className="mt-8 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white outline-none placeholder:text-white/25 focus:border-white/30" />
              <p className="mt-8 text-xs uppercase tracking-[0.18em] text-white/35">Training days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {week.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleManualDay(index)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors ${manualDays.includes(index) ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white"}`}
                  >
                    {manualDays.includes(index) && <Check className="size-3" />}
                    {day}
                  </button>
                ))}
              </div>
              <input value={manualWorkoutTitle} onChange={(event) => setManualWorkoutTitle(event.target.value)} placeholder="Workout name (applies to the days above, optional)" className="mt-6 h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
              {saveError && <p className="mt-4 text-sm text-red-200">{saveError}</p>}
              <button type="button" disabled={saving} onClick={() => void saveManualPlan()} className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-black disabled:opacity-50">{saving ? "Saving…" : "Create plan"}{!saving && <ArrowRight className="size-4" />}</button>
            </>
          ) : question ? (
            <>
              <div className="flex items-center justify-between"><p className="eyebrow">KOVA onboarding</p><span className="text-xs text-white/30">{step + 1} / {questions.length}</span></div>
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
              <h1 className="mt-10 font-serif text-5xl italic leading-[0.95] tracking-[-0.07em]">{question.title}</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">{question.explanation}</p>
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-xs text-white/40 hover:text-white"><CircleHelp className="size-4" />Explain this</button>
              {question.options.length > 0 ? <div className="mt-8 grid gap-2">{question.options.map((option) => <button type="button" key={option} onClick={() => setAnswer(option)} className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm transition-colors ${answers[question.key] === option ? "border-white/55 bg-white text-black" : "border-white/10 bg-white/[0.025] text-white/65 hover:bg-white/[0.06]"}`}>{option}{answers[question.key] === option && <Check className="size-4" />}</button>)}</div> : <textarea value={answers[question.key] ?? ""} onChange={(event) => setAnswer(event.target.value)} placeholder="You can leave this blank" className="mt-8 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />}
              {saveError && <p className="mt-4 text-sm text-red-200">{saveError}</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => { const next = { ...answers, [question.key]: "unknown" }; setAnswers(next); if (step === questions.length - 1) void saveAiPlan(); else setStep((value) => value + 1); }} className="h-11 rounded-full border border-white/10 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/50 hover:text-white">{step === questions.length - 1 ? "Skip & generate" : "Skip"}</button><button type="button" disabled={saving} onClick={() => { if (step === questions.length - 1) void saveAiPlan(); else setStep((value) => value + 1); }} className="group flex h-11 flex-1 items-center justify-center gap-3 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">{saving ? (stage ?? "Generating…") : step === questions.length - 1 ? "Generate my plan" : "Continue"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></button></div>
            </>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Seo title="Plan — KOVA AI" description="Build and manage your KOVA AI training plan." path="/dashboard/plan" />
      <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Your training</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Plan.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/45">A clear place for your workouts, recovery and progression.</p></div><button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black"><Plus className="size-4" />Create plan</button></div>{error && <p className="mt-8 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your plans: {error}</p>}{isLoading ? <p className="mt-12 text-sm text-white/40">Loading your plans…</p> : plans.length === 0 ? <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:p-12"><CalendarDays className="size-6 text-white/45" /><h2 className="mt-8 font-serif text-4xl italic tracking-[-0.06em]">No plan yet.</h2><p className="mt-3 max-w-md text-sm leading-7 text-white/45">Start with a guided setup or create a blank plan. KOVA never fills your history with made-up workouts.</p><button type="button" onClick={() => setCreating(true)} className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Open plan maker <ArrowRight className="size-4" /></button></div> : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{plans.map((plan) => (
        <div key={plan.id} className="group relative rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition-colors hover:bg-white/[0.06]">
          <Link to={`/dashboard/plan/${plan.id}`} className="absolute inset-0 z-0 rounded-[1.5rem]" aria-label={`Open ${plan.name}`} />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{plan.source === "ai" ? "KOVA draft" : "Manual"} · {plan.status}</p>
              <button
                type="button"
                onClick={() => setPlanToDelete(plan.id)}
                className="flex size-7 items-center justify-center rounded-full text-white/25 opacity-0 transition-opacity hover:bg-red-300/10 hover:text-red-200 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Delete ${plan.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <h2 className="mt-8 font-serif text-3xl italic tracking-[-0.05em]">{plan.name}</h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/40">{plan.is_public ? <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/45">Public</span> : null}Open plan details <ArrowRight className="ml-1 inline size-4" /></p>
          </div>
        </div>
      ))}</div>}</div>

      <AlertDialog open={Boolean(planToDelete)} onOpenChange={(open) => { if (!open) setPlanToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>This removes the plan, its workout days and exercises. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plan</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} disabled={deleting} className="bg-red-400 text-black hover:bg-red-300">{deleting ? "Deleting…" : "Delete plan"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}