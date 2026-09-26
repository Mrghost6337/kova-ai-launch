import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { computeTargets, type NutritionTargetInput } from "@/hooks/use-nutrition";
import { cn } from "@/lib/utils";

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
type Goal = "lose_fat" | "maintain" | "build_muscle";

const ACTIVITIES: Array<{ key: Activity; label: string; hint: string }> = [
  { key: "sedentary", label: "Mostly sitting", hint: "Desk or study, little movement" },
  { key: "light", label: "Lightly active", hint: "Some walking, 1–2 workouts a week" },
  { key: "moderate", label: "Moderately active", hint: "Training about 3–4 days a week" },
  { key: "active", label: "Very active", hint: "Training 5–6 days a week" },
  { key: "athlete", label: "Athlete", hint: "Daily training or a physical job" },
];

export const ease = [0.22, 1, 0.36, 1] as const;

export function StepShell({ step, total, title, hint, children }: { step: number; total: number; title: string; hint?: string; children: React.ReactNode }) {
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

export function OptionGrid<T extends string>({ options, value, onSelect }: { options: Array<{ key: T; label: string; hint?: string }>; value: T | null; onSelect: (key: T) => void }) {
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

export function NumberStepper({ value, onChange, min, max, unit, step = 1 }: { value: number; onChange: (next: number) => void; min: number; max: number; unit: string; step?: number }) {
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

/** Shared multi-step nutrition setup — used by the desktop page and mobile shell. */
export function NutritionOnboarding({ onDone, saving, error }: { onDone: (input: NutritionTargetInput) => void; saving: boolean; error: string | null }) {
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
