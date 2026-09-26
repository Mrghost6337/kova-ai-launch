import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KovaLogo } from "@/components/KovaLogo";
import { GlassButton, NumberDial, SelectCard } from "@/components/glass";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { supabase } from "@/lib/supabase";
import { generatePlanBlueprint } from "@/lib/plan-generator";

/* ————————————————————————————————————————————————————————————————————————
   KOVA first-time onboarding. One question per screen, smart controls only
   (no typing except the name / "Other" field), Apple-style transitions.
   Everything the athlete answers is saved to their real Supabase profile
   and — if they choose — turned into a real plan via the plan generator.
   ———————————————————————————————————————————————————————————————————————— */

const EXPERIENCE = [
  { value: "Beginner", description: "New to structured training, or starting fresh." },
  { value: "Intermediate", description: "Comfortable with the main lifts and routines." },
  { value: "Advanced", description: "Years of consistent, purposeful training." },
];

const GOALS = [
  { value: "Build muscle" },
  { value: "Get stronger" },
  { value: "Lose fat" },
  { value: "Improve fitness" },
  { value: "Maintain" },
];

const FREQUENCY = ["2 days", "3 days", "4 days", "5 days", "6 days"];

const LOCATIONS = [
  { value: "Gym", description: "Full equipment, weights and machines." },
  { value: "Home", description: "Dumbbells, bands and bodyweight." },
  { value: "Both", description: "A mix of gym and home sessions." },
];

const EQUIPMENT = [
  "Barbell",
  "Dumbbells",
  "Kettlebells",
  "Resistance bands",
  "Pull-up bar",
  "Bench",
  "Machines",
  "Bodyweight only",
];

const DISCOVERY = ["TikTok", "Instagram", "YouTube", "Google", "Friend", "App Store"];

const MOTION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

type Answers = {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  experience: string;
  goal: string;
  frequency: string;
  location: string;
  equipment: string[];
  discovery: string;
  discoveryOther: string;
  makePlan: boolean;
};

function Stepper({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          key={index}
          animate={{
            width: index === current ? 22 : 6,
            opacity: index <= current ? 1 : 0.25,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`h-1.5 rounded-full ${index <= current ? "bg-white/85" : "bg-white/40"}`}
        />
      ))}
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: Array<{ value: string; description?: string }>;
  value: string;
  onSelect: (value: string) => void;
  columns?: 1 | 2 | 3;
}) {
  const gridClass =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid gap-2.5 ${gridClass}`}>
      {options.map((option) => (
        <SelectCard
          key={option.value}
          selected={value === option.value}
          title={option.value}
          description={option.description}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

function ChipGrid({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(option)}
            className={`glass-chip h-10 px-4 text-sm transition-all ${selected ? "glass-chip--on" : ""}`}
          >
            {selected ? <Check className="size-3.5" strokeWidth={2.4} /> : null}
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const { profile, update } = useKovaProfile(user?.id);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialName = (profile?.display_name || user?.user_metadata?.display_name || "").split(" ")[0];
  const [answers, setAnswers] = useState<Answers>({
    name: initialName && initialName !== user?.email?.split("@")[0] ? initialName : "",
    age: 25,
    heightCm: 178,
    weightKg: 75,
    experience: "",
    goal: "",
    frequency: "",
    location: "",
    equipment: [],
    discovery: "",
    discoveryOther: "",
    makePlan: true,
  });

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const TOTAL = 11;
  const firstName = answers.name.trim().split(" ")[0] || "there";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const back = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((value) => value - 1);
  };

  const next = () => {
    setDirection(1);
    setStep((value) => Math.min(TOTAL - 1, value + 1));
  };

  const buildPlan = async () => {
    if (!supabase || !profile) throw new Error("Your session expired — sign in and try again.");
    const planAnswers = {
      experience: answers.experience,
      goal: answers.goal,
      availability: answers.frequency,
      location: answers.location === "Both" ? "Home + Gym" : answers.location,
      equipment: answers.equipment.join(", "),
      duration: "60 minutes",
      days: "",
      limitations: "",
      preferences: "",
    };
    const blueprint = await generatePlanBlueprint(planAnswers);
    const plan = await supabase
      .from("plans")
      .insert({
        user_id: profile.id,
        name: blueprint.name,
        source: "ai",
        status: "draft",
        onboarding_answers: planAnswers,
      })
      .select()
      .single();
    if (plan.error) throw plan.error;
    const dayRows = await supabase
      .from("plan_days")
      .insert(
        blueprint.days.map((day) => ({
          plan_id: plan.data.id,
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
    const validRows = exerciseRows.filter(
      (row): row is typeof row & { plan_day_id: string } => Boolean(row.plan_day_id),
    );
    if (validRows.length) {
      const exerciseResult = await supabase.from("plan_exercises").insert(validRows);
      if (exerciseResult.error) throw exerciseResult.error;
    }
    return { planId: plan.data.id as string, dayCount: createdDays.length, setCount: validRows.length };
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    setStage(answers.makePlan ? "Building your plan…" : "Saving your profile…");
    try {
      await update({
        display_name: answers.name.trim() || profile?.display_name || null,
        fitness_goal: answers.goal,
        training_level: answers.experience,
        age: answers.age,
        height_cm: answers.heightCm,
        weight_kg: answers.weightKg,
        goal: answers.goal,
        training_frequency: Number.parseInt(answers.frequency, 10) || null,
        training_location: answers.location,
        equipment: answers.equipment,
        discovery_source: answers.discovery === "Other" ? `Other: ${answers.discoveryOther.trim()}` : answers.discovery,
        onboarding_completed: true,
      });
      if (answers.makePlan) {
        const result = await buildPlan();
        toast(`Plan ready — ${result.setCount} exercises across ${result.dayCount} days.`);
      } else {
        toast("You're all set. Welcome to KOVA.");
      }
      setStage(null);
      setSaving(false);
      // Full navigation: the gate lives on its own profile subscription, so a
      // hard handoff guarantees the freshly-saved profile is picked up.
      window.location.assign("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
      setStage(null);
      setSaving(false);
    }
  };

  const canContinue = (() => {
    switch (step) {
      case 1:
        return answers.name.trim().length > 0;
      case 4:
        return Boolean(answers.experience);
      case 5:
        return Boolean(answers.goal);
      case 6:
        return Boolean(answers.frequency);
      case 7:
        return Boolean(answers.location);
      case 8:
        return answers.equipment.length > 0;
      case 9:
        return Boolean(answers.discovery) && (answers.discovery !== "Other" || answers.discoveryOther.trim().length > 0);
      default:
        return true;
    }
  })();

  const continueLabel = step === TOTAL - 1 ? (answers.makePlan ? "Create my plan" : "Enter KOVA") : "Continue";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="onboarding-backdrop flex items-center justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Set up KOVA"
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="onboarding-panel w-full max-w-xl p-6 sm:p-9"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KovaLogo className="size-7 rounded-[23%] ring-1 ring-white/15" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              KOVA <span className="font-light text-white/40">AI</span>
            </span>
          </div>
          {step > 0 && step < TOTAL - 1 ? <Stepper total={TOTAL - 2} current={step - 1} /> : null}
        </div>

        <div className="relative mt-8 min-h-[340px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 36, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: direction * -36, filter: "blur(6px)" }}
              transition={MOTION}
            >
              {step === 0 && (
                <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07]">
                    <Sparkles className="size-6 text-white/80" strokeWidth={1.6} />
                  </span>
                  <h1 className="t-h1 mt-7">Welcome to KOVA.</h1>
                  <p className="t-body mx-auto mt-3 max-w-sm">
                    A premium training coach built around you. Nine quick steps — every answer
                    shapes your plan. No typing unless it matters.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h1 className="t-h1">What's your name?</h1>
                  <p className="t-body mt-3">KOVA greets you and personalizes your plan with it.</p>
                  <input
                    autoFocus
                    value={answers.name}
                    onChange={(event) => set("name", event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && canContinue) next();
                    }}
                    placeholder="Your first name"
                    className="glass-field mt-8 h-14 text-lg"
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <h1 className="t-h1">How old are you, {firstName}?</h1>
                  <p className="t-body mt-3">Used only to calibrate your training zones.</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <NumberDial label="Age" value={answers.age} onChange={(value) => set("age", value)} min={14} max={90} />
                    <div className="glass-card hidden items-center justify-center p-5 sm:flex">
                      <p className="t-caption leading-6">
                        Age helps KOVA pick sensible starting intensities and rest periods.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h1 className="t-h1">Your body measurements.</h1>
                  <p className="t-body mt-3">Height and weight tune calorie and volume targets.</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <NumberDial
                      label="Height"
                      value={answers.heightCm}
                      onChange={(value) => set("heightCm", value)}
                      min={130}
                      max={220}
                      suffix="cm"
                    />
                    <NumberDial
                      label="Weight"
                      value={answers.weightKg}
                      onChange={(value) => set("weightKg", value)}
                      min={35}
                      max={200}
                      suffix="kg"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h1 className="t-h1">Training experience.</h1>
                  <p className="t-body mt-3">Be honest — it only changes where you start.</p>
                  <div className="mt-8">
                    <OptionGrid
                      options={EXPERIENCE}
                      value={answers.experience}
                      onSelect={(value) => {
                        set("experience", value);
                        window.setTimeout(next, 220);
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h1 className="t-h1">What's your main goal?</h1>
                  <p className="t-body mt-3">KOVA tunes sets, reps and rest around it.</p>
                  <div className="mt-8">
                    <OptionGrid
                      options={GOALS}
                      value={answers.goal}
                      onSelect={(value) => {
                        set("goal", value);
                        window.setTimeout(next, 220);
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 6 && (
                <div>
                  <h1 className="t-h1">How often can you train?</h1>
                  <p className="t-body mt-3">A plan should fit your real week, not an ideal one.</p>
                  <div className="mt-8">
                    <OptionGrid
                      options={FREQUENCY.map((value) => ({ value }))}
                      value={answers.frequency}
                      onSelect={(value) => {
                        set("frequency", value);
                        window.setTimeout(next, 220);
                      }}
                      columns={3}
                    />
                  </div>
                </div>
              )}

              {step === 7 && (
                <div>
                  <h1 className="t-h1">Where do you train?</h1>
                  <p className="t-body mt-3">This decides which movements fit your plan.</p>
                  <div className="mt-8">
                    <OptionGrid
                      options={LOCATIONS}
                      value={answers.location}
                      onSelect={(value) => {
                        set("location", value);
                        window.setTimeout(next, 220);
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 8 && (
                <div>
                  <h1 className="t-h1">Which equipment can you use?</h1>
                  <p className="t-body mt-3">Select everything you have access to.</p>
                  <div className="mt-8">
                    <ChipGrid
                      options={EQUIPMENT}
                      values={answers.equipment}
                      onToggle={(value) =>
                        set(
                          "equipment",
                          answers.equipment.includes(value)
                            ? answers.equipment.filter((item) => item !== value)
                            : [...answers.equipment, value],
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {step === 9 && (
                <div>
                  <h1 className="t-h1">Where did you hear about KOVA?</h1>
                  <p className="t-body mt-3">Helps us know where athletes come from.</p>
                  <div className="mt-8">
                    <OptionGrid
                      options={[...DISCOVERY.map((value) => ({ value })), { value: "Other" }]}
                      value={answers.discovery}
                      onSelect={(value) => {
                        set("discovery", value);
                        if (value !== "Other") window.setTimeout(next, 220);
                      }}
                      columns={3}
                    />
                    <AnimatePresence>
                      {answers.discovery === "Other" ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            autoFocus
                            value={answers.discoveryOther}
                            onChange={(event) => set("discoveryOther", event.target.value)}
                            placeholder="Tell us where…"
                            className="glass-field mt-3 h-12"
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {step === 10 && (
                <div>
                  <h1 className="t-h1">You're all set, {firstName}.</h1>
                  <p className="t-body mt-3">Here's the profile KOVA will train you with.</p>
                  <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                    <SummaryRow label="Name" value={firstName} />
                    <SummaryRow label="Experience" value={answers.experience} />
                    <SummaryRow label="Goal" value={answers.goal} />
                    <SummaryRow label="Frequency" value={`${answers.frequency}/week`} />
                    <SummaryRow label="Location" value={answers.location} />
                    <SummaryRow label="Equipment" value={`${answers.equipment.length} selected`} />
                  </div>
                  <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="min-w-0">
                      <span className="block text-sm text-white/80">Build my plan now</span>
                      <span className="mt-1 block text-xs leading-5 text-white/35">
                        Generate your first {answers.frequency} program from the real exercise catalog.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={answers.makePlan}
                      onChange={(event) => set("makePlan", event.target.checked)}
                      className="size-4 accent-white"
                    />
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <GlassButton variant="ghost" onClick={back} disabled={saving}>
              <ArrowLeft className="size-4" />
              Back
            </GlassButton>
          ) : (
            <span />
          )}
          {step === 0 ? (
            <GlassButton variant="primary" size="lg" onClick={next}>
              Get started
              <ArrowRight className="size-4" />
            </GlassButton>
          ) : step === TOTAL - 1 ? (
            <GlassButton variant="solid" size="lg" busy={saving} onClick={() => void finish()}>
              {saving ? (stage ?? "Working…") : continueLabel}
              {!saving ? <Dumbbell className="size-4" /> : null}
            </GlassButton>
          ) : (
            <GlassButton variant="primary" size="lg" disabled={!canContinue} onClick={next}>
              Continue
              <ArrowRight className="size-4" />
            </GlassButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
      <p className="t-label">{label}</p>
      <p className="mt-1.5 truncate text-sm text-white/85">{value}</p>
    </div>
  );
}
