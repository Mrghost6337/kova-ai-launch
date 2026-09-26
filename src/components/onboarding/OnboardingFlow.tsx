import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Blend,
  Building2,
  Calendar,
  Check,
  Compass,
  Dumbbell,
  Flame,
  Footprints,
  Gauge,
  HeartPulse,
  Home,
  Instagram,
  MapPin,
  Music2,
  Search,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wrench,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { KovaLogo } from "@/components/KovaLogo";
import { GlassButton, GlassToggle, NumberDial, SelectCard } from "@/components/glass";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { supabase } from "@/lib/supabase";
import { generatePlanBlueprint } from "@/lib/plan-generator";

/* ————————————————————————————————————————————————————————————————————————
   KOVA first-run onboarding — a cinematic glass stage over the blurred app.
   One question per screen, smart controls only (no typing unless it matters),
   every answer persisted to the athlete's real Supabase profile and — if they
   choose — turned into a real plan via the plan generator.
   ———————————————————————————————————————————————————————————————————————— */

const EXPERIENCE: Array<{ value: string; description?: string; icon?: LucideIcon }> = [
  { value: "Beginner", description: "New to structured training, or starting fresh.", icon: Sparkles },
  { value: "Intermediate", description: "Comfortable with the main lifts and routines.", icon: Activity },
  { value: "Advanced", description: "Years of consistent, purposeful training.", icon: Zap },
];

const GOALS: Array<{ value: string; description?: string; icon?: LucideIcon }> = [
  { value: "Build muscle", description: "Add size and strength.", icon: Dumbbell },
  { value: "Get stronger", description: "Push the big lifts up.", icon: Flame },
  { value: "Lose fat", description: "Lean out, keep the muscle.", icon: Target },
  { value: "Improve fitness", description: "Engine and endurance.", icon: HeartPulse },
  { value: "Maintain", description: "Stay sharp and consistent.", icon: Gauge },
];

const FREQUENCY = ["2 days", "3 days", "4 days", "5 days", "6 days"];

const LOCATIONS: Array<{ value: string; description?: string; icon?: LucideIcon }> = [
  { value: "Gym", description: "Full equipment, weights and machines.", icon: Building2 },
  { value: "Home", description: "Dumbbells, bands and bodyweight.", icon: Home },
  { value: "Both", description: "A mix of gym and home sessions.", icon: Blend },
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

const DISCOVERY: Array<{ value: string; icon: LucideIcon }> = [
  { value: "TikTok", icon: Music2 },
  { value: "Instagram", icon: Instagram },
  { value: "YouTube", icon: Youtube },
  { value: "Google", icon: Search },
  { value: "Friend", icon: Users },
  { value: "App Store", icon: Smartphone },
];

const MOTION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

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

function OptionGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: Array<{ value: string; description?: string; icon?: LucideIcon }>;
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
          icon={option.icon}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}

function FrequencyPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {FREQUENCY.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option)}
            className="onboarding-selectable flex flex-col items-center gap-1 px-2 py-4 text-center"
          >
            <span className={`t-metric text-3xl ${selected ? "" : "text-white/70"}`}>{option.slice(0, 1)}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
              {selected ? <Check className="size-3.5" strokeWidth={2.6} /> : "days"}
            </span>
          </button>
        );
      })}
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

function SummaryTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="onboarding-summary">
      <span className="onboarding-summary--icon" aria-hidden>
        <Icon className="size-4" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</span>
        <span className="mt-0.5 block truncate text-sm text-white/85">{value}</span>
      </span>
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
  const [finished, setFinished] = useState(false);
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
    if (step === 0 || saving) return;
    setDirection(-1);
    setStep((value) => value - 1);
  };

  const next = () => {
    if (saving) return;
    setDirection(1);
    setStep((value) => Math.min(TOTAL - 1, value + 1));
  };

  const pickAndAdvance = (apply: () => void) => {
    apply();
    window.setTimeout(next, 300);
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
      // Let the completion moment breathe before handing off to the dashboard.
      setSaving(false);
      setFinished(true);
      window.setTimeout(() => window.location.assign("/dashboard"), 1600);
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

  const questionCount = TOTAL - 2; // welcome + ready are not "questions"
  const progressFill = Math.min(100, Math.round((Math.max(0, step - 1) / questionCount) * 100));
  const continueLabel = step === TOTAL - 1 ? (answers.makePlan ? "Create my plan" : "Enter KOVA") : "Continue";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Set up KOVA"
    >
      {/* Ambient stage — blurred app behind, drifting light orbs, vignette. */}
      <div className="onboarding-scene" aria-hidden>
        <span className="ambient-orb ambient-orb--a" />
        <span className="ambient-orb ambient-orb--b" />
        <span className="ambient-orb ambient-orb--c" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="onboarding-panel p-6 sm:p-9"
      >
        {finished ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex size-16 items-center justify-center rounded-full bg-white text-black"
            >
              <Check className="size-7" strokeWidth={2.4} />
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: MOTION.ease }}
              className="t-h1 mt-7"
            >
              Welcome to KOVA, {firstName}.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5, ease: MOTION.ease }}
              className="t-body mt-3"
            >
              Your profile is saved. Taking you to your dashboard…
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="onboarding-progress mt-8 w-48"
              style={{ "--fill": 100 } as CSSProperties}
              aria-hidden
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KovaLogo className="size-7 rounded-[23%] ring-1 ring-white/15" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  KOVA <span className="font-light text-white/40">AI</span>
                </span>
              </div>
              {step > 0 && step < TOTAL - 1 ? (
                <p className="t-label">
                  Step {step} of {TOTAL - 2}
                </p>
              ) : null}
            </div>

            <div
              className="onboarding-progress mt-5"
              style={{ "--fill": progressFill } as CSSProperties}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressFill}
            />

            <div className="relative mt-8 min-h-[340px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 44, filter: "blur(8px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: direction * -44, filter: "blur(8px)" }}
                  transition={MOTION}
                  className="onboarding-stagger space-y-8"
                >
                  {step === 0 && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                      <span className="flex size-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07]">
                        <Sparkles className="size-6 text-white/80" strokeWidth={1.6} />
                      </span>
                      <h1 className="t-h1 mt-7">
                        {greeting}. Ready to train?
                      </h1>
                      <p className="t-body mx-auto mt-3 max-w-sm">
                        KOVA builds a plan around who you are. Nine quick steps — every answer shapes
                        your training. No typing unless it matters.
                      </p>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h1 className="t-h1">What should KOVA call you?</h1>
                      <p className="t-body mt-3">Your name personalizes every session.</p>
                      <input
                        autoFocus
                        value={answers.name}
                        onChange={(event) => set("name", event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && canContinue) next();
                        }}
                        placeholder="Your first name"
                        className="onboarding-field mt-8 text-lg"
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h1 className="t-h1">How old are you, {firstName}?</h1>
                      <p className="t-body mt-3">Used only to calibrate intensity and recovery.</p>
                      <div className="mx-auto mt-8 max-w-sm">
                        <NumberDial label="Age" value={answers.age} onChange={(value) => set("age", value)} min={14} max={90} />
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
                      <p className="t-body mt-3">Be honest — it only decides where you start.</p>
                      <OptionGrid
                        options={EXPERIENCE}
                        value={answers.experience}
                        onSelect={(value) => pickAndAdvance(() => set("experience", value))}
                        columns={3}
                      />
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                      <h1 className="t-h1">What's your main goal?</h1>
                      <p className="t-body mt-3">KOVA tunes sets, reps and rest around it.</p>
                      <OptionGrid
                        options={GOALS}
                        value={answers.goal}
                        onSelect={(value) => pickAndAdvance(() => set("goal", value))}
                      />
                    </div>
                  )}

                  {step === 6 && (
                    <div>
                      <h1 className="t-h1">How often can you train?</h1>
                      <p className="t-body mt-3">A plan should fit your real week, not an ideal one.</p>
                      <FrequencyPicker
                        value={answers.frequency}
                        onSelect={(value) => pickAndAdvance(() => set("frequency", value))}
                      />
                    </div>
                  )}

                  {step === 7 && (
                    <div>
                      <h1 className="t-h1">Where do you train?</h1>
                      <p className="t-body mt-3">This decides which movements fit your plan.</p>
                      <OptionGrid
                        options={LOCATIONS}
                        value={answers.location}
                        onSelect={(value) => pickAndAdvance(() => set("location", value))}
                        columns={3}
                      />
                    </div>
                  )}

                  {step === 8 && (
                    <div>
                      <h1 className="t-h1">Which equipment can you use?</h1>
                      <p className="t-body mt-3">Select everything you have access to.</p>
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
                  )}

                  {step === 9 && (
                    <div>
                      <h1 className="t-h1">Where did you hear about KOVA?</h1>
                      <p className="t-body mt-3">Helps us know where athletes come from.</p>
                      <div>
                        <OptionGrid
                          options={[
                            ...DISCOVERY.map((option) => ({ value: option.value, icon: option.icon })),
                            { value: "Other", icon: Compass },
                          ]}
                          value={answers.discovery}
                          onSelect={(value) =>
                            pickAndAdvance(() => set("discovery", value))
                          }
                          columns={3}
                        />
                      </div>
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
                              className="onboarding-field mt-3"
                            />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )}

                  {step === 10 && (
                    <div>
                      <h1 className="t-h1">You're all set, {firstName}.</h1>
                      <p className="t-body mt-3">Here's the profile KOVA will train you with.</p>
                      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                        <SummaryTile label="Name" value={firstName} icon={Footprints} />
                        <SummaryTile label="Experience" value={answers.experience} icon={Activity} />
                        <SummaryTile label="Goal" value={answers.goal} icon={Target} />
                        <SummaryTile label="Frequency" value={`${answers.frequency} / week`} icon={Calendar} />
                        <SummaryTile label="Location" value={answers.location} icon={MapPin} />
                        <SummaryTile
                          label="Equipment"
                          value={answers.equipment.length ? `${answers.equipment.length} selected` : "Bodyweight only"}
                          icon={Wrench}
                        />
                      </div>
                      <div className="onboarding-selectable mt-3 flex cursor-pointer items-center justify-between gap-4">
                        <span className="flex min-w-0 items-center gap-3.5">
                          <span className="onboarding-summary--icon" aria-hidden>
                            <Sparkles className="size-4" strokeWidth={1.7} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm text-white/85">Build my plan now</span>
                            <span className="mt-0.5 block text-xs leading-5 text-white/38">
                              Generate your first {answers.frequency} program from the real exercise catalog.
                            </span>
                          </span>
                        </span>
                        <GlassToggle
                          checked={answers.makePlan}
                          onChange={(checked) => set("makePlan", checked)}
                          label="Build plan"
                        />
                      </div>
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
                  {!saving ? <ArrowRight className="size-4" /> : null}
                </GlassButton>
              ) : (
                <GlassButton variant="primary" size="lg" disabled={!canContinue} onClick={next}>
                  Continue
                  <ArrowRight className="size-4" />
                </GlassButton>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
