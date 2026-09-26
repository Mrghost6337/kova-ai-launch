import { ArrowLeft, ArrowRight, CalendarDays, Check, Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { GlassButton, GlassCard, GlassChip, GlassField, SectionHeader, SelectCard } from "@/components/glass";
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
import { motion } from "framer-motion";

/* The guided plan wizard. Same question engine as before — restyled with the
   liquid-glass system. Answers feed the real deterministic plan generator. */

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

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

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
          <GlassButton variant="ghost" size="sm" onClick={() => { if (!mode) setCreating(false); else if (mode === "ai" && step > 0) setStep((value) => value - 1); else setMode(null); }}>
            <ArrowLeft className="size-4" />
            Back
          </GlassButton>

          {!mode ? (
            <motion.div {...pageMotion}>
              <p className="t-label mt-8">Plan maker</p>
              <h1 className="t-h1 mt-4">How should we start?</h1>
              <p className="t-body mt-4 max-w-lg">Choose a starting point. Both options stay editable, and nothing is generated until you confirm.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <SelectCard
                  selected={false}
                  title="Create with AI"
                  description="Answer a few simple questions progressively. Skip anything you do not know."
                  onClick={() => setMode("ai")}
                  className="!p-6"
                />
                <SelectCard
                  selected={false}
                  title="Create manually"
                  description="Name your plan, pick your training days and start building workouts instantly."
                  onClick={() => setMode("manual")}
                  className="!p-6"
                />
              </div>
            </motion.div>
          ) : mode === "manual" ? (
            <motion.div {...pageMotion}>
              <p className="t-label mt-8">Manual plan</p>
              <h1 className="t-h1 mt-4">Name your plan.</h1>
              <p className="t-body mt-4">Pick the days you want to train. You can add or change everything later.</p>
              <GlassField className="mt-8 h-14 text-base" value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="e.g. My strength plan" aria-label="Plan name" />
              <p className="t-label mt-8">Training days</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {week.map((day, index) => (
                  <GlassChip key={day} selected={manualDays.includes(index)} onClick={() => toggleManualDay(index)}>
                    {manualDays.includes(index) ? <Check className="size-3" /> : null}
                    {day}
                  </GlassChip>
                ))}
              </div>
              <GlassField className="mt-6" value={manualWorkoutTitle} onChange={(event) => setManualWorkoutTitle(event.target.value)} placeholder="Workout name (applies to the days above, optional)" aria-label="Workout name" />
              {saveError && <p className="mt-4 text-sm text-red-300">{saveError}</p>}
              <GlassButton variant="solid" size="lg" busy={saving} className="mt-5 w-full" onClick={() => void saveManualPlan()}>
                {saving ? "Saving…" : "Create plan"}
                {!saving ? <ArrowRight className="size-4" /> : null}
              </GlassButton>
            </motion.div>
          ) : question ? (
            <div>
              <div className="mt-8 flex items-center justify-between">
                <p className="t-label">KOVA onboarding</p>
                <span className="t-caption">{step + 1} / {questions.length}</span>
              </div>
              <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div className="h-full rounded-full bg-white/85" initial={false} animate={{ width: `${((step + 1) / questions.length) * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="t-h1 mt-10">{question.title}</h1>
                <p className="t-body mt-4 max-w-lg">{question.explanation}</p>
                {question.options.length > 0 ? (
                  <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <SelectCard
                        key={option}
                        selected={answers[question.key] === option}
                        title={option}
                        onClick={() => {
                          setAnswer(option);
                          if (step === questions.length - 1) void saveAiPlan();
                          else window.setTimeout(() => setStep((value) => value + 1), 200);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.key] ?? ""}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="You can leave this blank"
                    className="glass-field mt-8 min-h-32 resize-none p-4 text-sm leading-6"
                  />
                )}
                {saveError && <p className="mt-4 text-sm text-red-300">{saveError}</p>}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      const next = { ...answers, [question.key]: "unknown" };
                      setAnswers(next);
                      if (step === questions.length - 1) void saveAiPlan();
                      else setStep((value) => value + 1);
                    }}
                    disabled={saving}
                  >
                    {step === questions.length - 1 ? "Skip & generate" : "Skip"}
                  </GlassButton>
                  {question.options.length > 0 ? (
                    <GlassButton
                      variant="solid"
                      size="lg"
                      busy={saving}
                      className="flex-1"
                      onClick={() => {
                        if (step === questions.length - 1) void saveAiPlan();
                        else setStep((value) => value + 1);
                      }}
                    >
                      {saving ? (stage ?? "Generating…") : step === questions.length - 1 ? "Generate my plan" : "Continue"}
                    </GlassButton>
                  ) : (
                    <GlassButton
                      variant="solid"
                      size="lg"
                      busy={saving}
                      className="flex-1"
                      onClick={() => {
                        if (step === questions.length - 1) void saveAiPlan();
                        else setStep((value) => value + 1);
                      }}
                    >
                      {saving ? (stage ?? "Generating…") : step === questions.length - 1 ? "Generate my plan" : "Continue"}
                      {!saving ? <ArrowRight className="size-4" /> : null}
                    </GlassButton>
                  )}
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Seo title="Plan — KOVA AI" description="Build and manage your KOVA AI training plan." path="/dashboard/plan" />
      <div className="mx-auto max-w-6xl">
        <motion.div {...pageMotion} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="t-label">Your training</p>
            <h1 className="t-display mt-4">Plan.</h1>
            <p className="t-body mt-4 max-w-lg">A clear place for your workouts, recovery and progression.</p>
          </div>
          <GlassButton variant="solid" size="lg" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Create plan
          </GlassButton>
        </motion.div>

        {error && <p className="mt-8 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your plans: {error}</p>}

        {isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="skeleton h-48 rounded-[1.5rem]" />
            <div className="skeleton h-48 rounded-[1.5rem]" />
            <div className="skeleton h-48 rounded-[1.5rem]" />
          </div>
        ) : plans.length === 0 ? (
          <GlassCard className="mt-10 p-8 sm:p-12">
            <CalendarDays className="size-6 text-white/40" strokeWidth={1.6} />
            <h2 className="t-h1 mt-7">No plan yet.</h2>
            <p className="t-body mt-3 max-w-md">Start with a guided setup or create a blank plan. KOVA never fills your history with made-up workouts.</p>
            <GlassButton variant="primary" size="lg" className="mt-7" onClick={() => setCreating(true)}>
              Open plan maker
              <ArrowRight className="size-4" />
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.45 }}>
                <GlassCard interactive className="group relative h-full p-6">
                  <Link to={`/dashboard/plan/${plan.id}`} className="absolute inset-0 z-0 rounded-[inherit]" aria-label={`Open ${plan.name}`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3">
                      <SectionHeader icon={plan.source === "ai" ? Sparkles : Dumbbell} label={`${plan.source === "ai" ? "KOVA draft" : "Manual"} · ${plan.status}`} />
                      <button
                        type="button"
                        onClick={() => setPlanToDelete(plan.id)}
                        className="relative z-20 flex size-7 items-center justify-center rounded-full text-white/25 opacity-0 transition-opacity hover:bg-red-300/10 hover:text-red-200 group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Delete ${plan.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <h2 className="t-h2 mt-8">{plan.name}</h2>
                    <p className="t-caption mt-3 flex items-center gap-2">
                      {plan.is_public ? <span className="glass-chip h-6 px-2.5 text-[10px]">Public</span> : null}
                      Open plan details
                      <ArrowRight className="ml-1 inline size-3.5" />
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
