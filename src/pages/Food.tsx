import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Flame,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { computeTargets, todayKey, useFoodEntries, useNutritionTargets, type NutritionTargetInput } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
type Goal = "lose_fat" | "maintain" | "build_muscle";
type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: Array<{ key: Meal; label: string; icon: typeof Apple }> = [
  { key: "breakfast", label: "Breakfast", icon: Apple },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { key: "dinner", label: "Dinner", icon: ChefHat },
  { key: "snack", label: "Snacks", icon: Flame },
];

const ACTIVITIES: Array<{ key: Activity; label: string; hint: string }> = [
  { key: "sedentary", label: "Mostly sitting", hint: "Desk or study, little movement" },
  { key: "light", label: "Lightly active", hint: "Some walking, 1–2 workouts a week" },
  { key: "moderate", label: "Moderately active", hint: "Training about 3–4 days a week" },
  { key: "active", label: "Very active", hint: "Training 5–6 days a week" },
  { key: "athlete", label: "Athlete", hint: "Daily training or a physical job" },
];

const ease = [0.22, 1, 0.36, 1] as const;

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/45">{label}</span>
        <span className="text-xs text-white/60">
          <span className="text-white/85">{Math.round(value)}g</span> / {target}g
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---------------- Onboarding: a focused, multi-step setup overlay ---------------- */

function StepShell({ step, total, title, hint, children }: { step: number; total: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: 0.35, ease }}>
      <div className="mt-6 flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", index <= step ? "bg-white" : "bg-white/12")} />
        ))}
      </div>
      <h2 className="mt-7 font-serif text-4xl italic tracking-[-0.05em] sm:text-5xl">{title}</h2>
      {hint ? <p className="mt-3 text-sm leading-6 text-white/45">{hint}</p> : null}
      <div className="mt-7">{children}</div>
    </motion.div>
  );
}

function OptionGrid<T extends string>({ options, value, onSelect }: { options: Array<{ key: T; label: string; hint?: string }>; value: T | null; onSelect: (key: T) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onSelect(option.key)}
          className={cn(
            "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
            value === option.key ? "border-white/55 bg-white text-black" : "border-white/10 bg-white/[0.025] text-white/70 hover:bg-white/[0.07]",
          )}
        >
          <span>
            <span className="block text-sm font-medium">{option.label}</span>
            {option.hint ? <span className={cn("mt-0.5 block text-xs", value === option.key ? "text-black/55" : "text-white/35")}>{option.hint}</span> : null}
          </span>
          {value === option.key ? <Check className="size-4" /> : null}
        </button>
      ))}
    </div>
  );
}

function NumberStepper({ value, onChange, min, max, unit, step = 1 }: { value: number; onChange: (next: number) => void; min: number; max: number; unit: string; step?: number }) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <button type="button" onClick={() => onChange(clamp(value - step))} className="flex size-12 items-center justify-center rounded-full border border-white/10 text-xl text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white" aria-label={`Decrease ${unit}`}>−</button>
      <div className="text-center">
        <span className="text-4xl font-semibold tracking-tight text-white">{value}</span>
        <span className="ml-1.5 text-sm text-white/40">{unit}</span>
      </div>
      <button type="button" onClick={() => onChange(clamp(value + step))} className="flex size-12 items-center justify-center rounded-full border border-white/10 text-xl text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white" aria-label={`Increase ${unit}`}>+</button>
    </div>
  );
}

const ONBOARDING_STEPS = 6;

function OnboardingOverlay({ onDone, saving, error }: { onDone: (input: NutritionTargetInput) => void; saving: boolean; error: string | null }) {
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(180);
  const [weightKg, setWeightKg] = useState(75);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const canContinue =
    (step === 0 && sex !== null) ||
    (step === 1 && age >= 10) ||
    (step === 2 && heightCm >= 100) ||
    (step === 3 && weightKg >= 30) ||
    (step === 4 && activity !== null) ||
    (step === 5 && goal !== null);

  const preview = useMemo(
    () =>
      sex && activity && goal
        ? computeTargets({ sex, age, heightCm, weightKg, activity, goal })
        : null,
    [sex, age, heightCm, weightKg, activity, goal],
  );

  const finish = () => {
    if (!sex || !activity || !goal) return;
    onDone({
      sex,
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity,
      goal,
      ...computeTargets({ sex, age, heightCm, weightKg, activity, goal }),
    });
  };

  const next = () => {
    if (step < ONBOARDING_STEPS - 1) setStep((value) => value + 1);
    else finish();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Nutrition setup"
    >
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="liquid-glass w-full max-w-lg rounded-[2rem] border-white/15 bg-[var(--surface-solid)] p-6 sm:p-9"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
            <Sparkles className="size-3.5 text-kova-amber" />KOVA Nutrition setup
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">{step + 1} / {ONBOARDING_STEPS}</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepShell key="s0" step={0} total={ONBOARDING_STEPS} title="What is your sex?" hint="Used for the calorie formula — nothing else.">
              <OptionGrid
                options={[{ key: "male" as Sex, label: "Male" }, { key: "female" as Sex, label: "Female" }]}
                value={sex}
                onSelect={setSex}
              />
            </StepShell>
          )}
          {step === 1 && (
            <StepShell key="s1" step={1} total={ONBOARDING_STEPS} title="How old are you?">
              <NumberStepper value={age} onChange={setAge} min={10} max={100} unit="years" />
            </StepShell>
          )}
          {step === 2 && (
            <StepShell key="s2" step={2} total={ONBOARDING_STEPS} title="How tall are you?">
              <NumberStepper value={heightCm} onChange={setHeightCm} min={100} max={250} unit="cm" />
            </StepShell>
          )}
          {step === 3 && (
            <StepShell key="s3" step={3} total={ONBOARDING_STEPS} title="What do you weigh?" hint="A close estimate is fine — you can update it later.">
              <NumberStepper value={weightKg} onChange={setWeightKg} min={30} max={300} unit="kg" />
            </StepShell>
          )}
          {step === 4 && (
            <StepShell key="s4" step={4} total={ONBOARDING_STEPS} title="How active are you?" hint="Outside of your workouts — work, study, daily movement.">
              <OptionGrid options={ACTIVITIES} value={activity} onSelect={setActivity} />
            </StepShell>
          )}
          {step === 5 && (
            <StepShell key="s5" step={5} total={ONBOARDING_STEPS} title="What is your goal?">
              <OptionGrid
                options={[
                  { key: "lose_fat" as Goal, label: "Lose fat", hint: "A moderate calorie deficit" },
                  { key: "maintain" as Goal, label: "Maintain", hint: "Stay at your current weight" },
                  { key: "build_muscle" as Goal, label: "Build muscle", hint: "A small calorie surplus" },
                ]}
                value={goal}
                onSelect={setGoal}
              />
              {preview && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                  <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">kcal</p><p className="mt-1 text-lg font-semibold text-kova-amber">{preview.calorie_target}</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">protein</p><p className="mt-1 text-lg font-semibold text-kova-rose">{preview.protein_target}g</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">carbs</p><p className="mt-1 text-lg font-semibold text-kova-sky">{preview.carb_target}g</p></div>
                  <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">fat</p><p className="mt-1 text-lg font-semibold text-kova-emerald">{preview.fat_target}g</p></div>
                </motion.div>
              )}
            </StepShell>
          )}
        </AnimatePresence>

        {error && <p className="mt-4 text-sm text-red-200">{error}</p>}

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep((value) => value - 1)} disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/12 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white disabled:opacity-40">
              <ArrowLeft className="size-4" />Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canContinue || saving}
            className="group inline-flex h-12 flex-1 items-center justify-center gap-3 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black transition-opacity disabled:opacity-30"
          >
            {saving ? (
              <><Loader2 className="size-4 animate-spin" />Calculating…</>
            ) : step === ONBOARDING_STEPS - 1 ? (
              <>Set my targets<Check className="size-4" /></>
            ) : (
              <>Continue<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></>
            )}
          </button>
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-white/30">
          Calculated with the Mifflin-St Jeor formula — the standard a dietitian would use. Saved to your profile, editable anytime.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Page ---------------- */

export default function Food() {
  const { user } = useSupabaseAuth();
  const { targets, isLoading: targetsLoading, error: targetsError, save, reload: reloadTargets } = useNutritionTargets(user?.id);
  const [date, setDate] = useState(todayKey());
  const { entries, isLoading: entriesLoading, error: entriesError, addEntry, removeEntry } = useFoodEntries(user?.id, date);
  const [showSetup, setShowSetup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const totals = useMemo(
    () =>
      entries.reduce(
        (sum, entry) => ({
          calories: sum.calories + entry.calories,
          protein: sum.protein + entry.protein_g,
          carbs: sum.carbs + entry.carbs_g,
          fat: sum.fat + entry.fat_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [entries],
  );

  useEffect(() => {
    if (targetsLoading) return;
    setShowSetup(!targets);
  }, [targets, targetsLoading]);

  const submitEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !calories) {
      setFormError("A name and calories are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await addEntry({
        meal,
        name: name.trim(),
        calories: Math.max(0, Math.min(5000, Math.round(Number(calories) || 0))),
        protein_g: Math.max(0, Math.min(500, Math.round(Number(protein) || 0))),
        carbs_g: Math.max(0, Math.min(800, Math.round(Number(carbs) || 0))),
        fat_g: Math.max(0, Math.min(300, Math.round(Number(fat) || 0))),
      });
      setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
      setLogOpen(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save this meal.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetupDone = (input: NutritionTargetInput) => {
    setSaveError(null);
    void save(input)
      .then(() => setShowSetup(false))
      .catch((cause) => setSaveError(cause instanceof Error ? cause.message : "Could not save your targets."));
  };

  const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const caloriePct = targets ? Math.min(100, Math.round((totals.calories / targets.calorie_target) * 100)) : 0;
  const over = targets ? totals.calories > targets.calorie_target : false;

  return (
    <AppShell>
      <Seo title="Food — KOVA AI" description="Nutrition targets and a real food log connected to your KOVA training." path="/dashboard/food" />
      <AnimatePresence>
        {showSetup && !targetsLoading && (
          <OnboardingOverlay onDone={handleSetupDone} saving={targetsLoading} error={saveError} />
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Nutrition</p>
            <h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Food.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">Real macro targets and a daily log. Everything saved to your profile — no fake numbers.</p>
          </div>
          <button type="button" onClick={() => setShowSetup(true)} className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]">
            <Sparkles className="size-4" />Recalculate targets
          </button>
        </div>

        {targetsError && <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your targets: {targetsError}</p>}

        {targetsLoading ? (
          <p className="mt-12 flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your nutrition…</p>
        ) : !targets ? (
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-14">
            <Sparkles className="mx-auto size-6 text-kova-amber" />
            <h2 className="mt-6 font-serif text-4xl italic tracking-[-0.05em]">Let's set your nutrition.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">Six quick questions — height, weight, activity and goal. KOVA turns them into daily calorie and macro targets.</p>
            <button type="button" onClick={() => setShowSetup(true)} className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-white px-7 text-xs font-semibold uppercase tracking-[0.12em] text-black">
              Start setup<ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Today's rings */}
            <section className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl italic">{dayLabel}</h2>
                  <p className="mt-1.5 text-sm text-white/40">{over ? `${totals.calories - targets.calorie_target} kcal over target` : `${targets.calorie_target - totals.calories} kcal remaining`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={date} max={todayKey()} onChange={(event) => setDate(event.target.value || todayKey())} className="h-10 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs text-white/70 outline-none [color-scheme:dark]" />
                </div>
              </div>

              <div className="mt-7 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                {/* Calorie ring */}
                <div className="relative mx-auto size-40">
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={over ? "var(--accent-rose)" : "var(--accent-amber)"}
                      strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${(caloriePct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-semibold">{totals.calories}</span>
                    <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/35">of {targets.calorie_target} kcal</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <MacroBar label="Protein" value={totals.protein} target={targets.protein_target} color="bg-kova-rose" />
                  <MacroBar label="Carbs" value={totals.carbs} target={targets.carb_target} color="bg-kova-sky" />
                  <MacroBar label="Fat" value={totals.fat} target={targets.fat_target} color="bg-kova-emerald" />
                  <button type="button" onClick={() => { setLogOpen((open) => !open); if (!logOpen) setFormError(""); }} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                    <Plus className="size-4" />Log food
                  </button>
                </div>
              </div>

              {/* Quick add form */}
              {logOpen && (
                <form onSubmit={submitEntry} className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap gap-2">
                    {MEALS.map((option) => (
                      <button key={option.key} type="button" onClick={() => setMeal(option.key)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors", meal === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:text-white")}>
                        <option.icon className="size-3.5" />{option.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <input value={name} onChange={(event) => setName(event.target.value)} placeholder="What did you eat?" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30 lg:col-span-2" />
                    <input type="number" min={0} value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="kcal" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                    <input type="number" min={0} value={protein} onChange={(event) => setProtein(event.target.value)} placeholder="Protein g" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                    <input type="number" min={0} value={carbs} onChange={(event) => setCarbs(event.target.value)} placeholder="Carbs g" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                    <input type="number" min={0} value={fat} onChange={(event) => setFat(event.target.value)} placeholder="Fat g" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                  </div>
                  {formError && <p className="mt-3 text-sm text-red-200">{formError}</p>}
                  <div className="mt-4 flex gap-2">
                    <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save meal</button>
                    <button type="button" onClick={() => setLogOpen(false)} className="rounded-full border border-white/10 px-4 text-xs text-white/50 hover:text-white">Cancel</button>
                  </div>
                </form>
              )}
            </section>

            {/* Meals */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {MEALS.map((section) => {
                const sectionEntries = entries.filter((entry) => entry.meal === section.key);
                const sectionCalories = sectionEntries.reduce((sum, entry) => sum + entry.calories, 0);
                return (
                  <section key={section.key} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/60"><section.icon className="size-4" /></span>
                        <h3 className="font-serif text-2xl italic">{section.label}</h3>
                      </div>
                      <span className="text-xs text-white/40">{sectionCalories} kcal</span>
                    </div>
                    {sectionEntries.length ? (
                      <ul className="mt-4 divide-y divide-white/[0.06]">
                        {sectionEntries.map((entry) => (
                          <li key={entry.id} className="group flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white/80">{entry.name}</p>
                              <p className="mt-0.5 text-xs text-white/35">P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/55">{entry.calories} kcal</span>
                              <button type="button" onClick={() => void removeEntry(entry.id).catch(() => undefined)} className="flex size-7 items-center justify-center rounded-full text-white/25 opacity-0 transition-opacity hover:bg-red-300/10 hover:text-red-200 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Remove ${entry.name}`}>
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <button type="button" onClick={() => { setMeal(section.key); setLogOpen(true); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-5 text-xs text-white/35 transition-colors hover:border-white/30 hover:text-white/60">
                        <Plus className="size-3.5" />Add to {section.label.toLowerCase()}
                      </button>
                    )}
                  </section>
                );
              })}
            </div>

            {entriesLoading && <p className="mt-6 flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your log…</p>}
            {entriesError && <p className="mt-6 text-sm text-red-200">Could not load your log: {entriesError}</p>}
          </>
        )}
      </div>
    </AppShell>
  );
}
