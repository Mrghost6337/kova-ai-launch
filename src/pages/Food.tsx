import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  Beef,
  Calculator,
  Check,
  ChefHat,
  ChevronDown,
  Flame,
  Loader2,
  Plus,
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
  { key: "sedentary", label: "Sedentary", hint: "Desk work, little movement" },
  { key: "light", label: "Lightly active", hint: "Light exercise 1–3 days/week" },
  { key: "moderate", label: "Moderately active", hint: "Training 3–5 days/week" },
  { key: "active", label: "Very active", hint: "Training 6–7 days/week" },
  { key: "athlete", label: "Athlete", hint: "Twice-daily or physical job" },
];

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

function SetupForm({ onDone }: { onDone: (input: NutritionTargetInput) => void }) {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("180");
  const [weight, setWeight] = useState("75");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("build_muscle");

  const preview = useMemo(
    () =>
      computeTargets({
        sex,
        age: Math.max(10, Math.min(100, Number(age) || 25)),
        heightCm: Math.max(100, Math.min(250, Number(height) || 180)),
        weightKg: Math.max(30, Math.min(300, Number(weight) || 75)),
        activity,
        goal,
      }),
    [sex, age, height, weight, activity, goal],
  );

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-xs transition-colors",
      active ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white",
    );

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Calculator className="size-5 text-kova-amber" />
        <h2 className="font-serif text-3xl italic">Set your nutrition targets.</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/40">
        KOVA calculates your calories and macros with the Mifflin-St Jeor formula — the same science a coach would use. Everything is saved to your profile and editable later.
      </p>

      <div className="mt-7 space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/35">Sex</p>
          <div className="flex gap-2">
            {(["male", "female"] as Sex[]).map((option) => (
              <button key={option} type="button" onClick={() => setSex(option)} className={chip(sex === option)}>
                {option === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs text-white/45">Age</span>
            <input type="number" min={10} max={100} value={age} onChange={(event) => setAge(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-white/45">Height (cm)</span>
            <input type="number" min={100} max={250} value={height} onChange={(event) => setHeight(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-white/45">Weight (kg)</span>
            <input type="number" min={30} max={300} value={weight} onChange={(event) => setWeight(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-white/30" />
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/35">Activity level</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIVITIES.map((option) => (
              <button key={option.key} type="button" onClick={() => setActivity(option.key)} className={cn("rounded-2xl border p-3.5 text-left transition-colors", activity === option.key ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]")}>
                <span className="block text-sm text-white/80">{option.label}</span>
                <span className="mt-0.5 block text-xs text-white/35">{option.hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/35">Goal</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setGoal("lose_fat")} className={chip(goal === "lose_fat")}>Lose fat</button>
            <button type="button" onClick={() => setGoal("maintain")} className={chip(goal === "maintain")}>Maintain</button>
            <button type="button" onClick={() => setGoal("build_muscle")} className={chip(goal === "build_muscle")}>Build muscle</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-4">
          <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Calories</p><p className="mt-1 text-xl font-semibold text-kova-amber">{preview.calorie_target}</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Protein</p><p className="mt-1 text-xl font-semibold text-kova-rose">{preview.protein_target}g</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Carbs</p><p className="mt-1 text-xl font-semibold text-kova-sky">{preview.carb_target}g</p></div>
          <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Fat</p><p className="mt-1 text-xl font-semibold text-kova-emerald">{preview.fat_target}g</p></div>
        </div>

        <button
          type="button"
          onClick={() =>
            onDone({
              sex,
              age: Math.max(10, Math.min(100, Number(age) || 25)),
              height_cm: Math.max(100, Math.min(250, Number(height) || 180)),
              weight_kg: Math.max(30, Math.min(300, Number(weight) || 75)),
              activity,
              goal,
              ...preview,
            })
          }
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black sm:w-auto sm:px-8"
        >
          Save my targets <Check className="size-4" />
        </button>
      </div>
    </div>
  );
}

export default function Food() {
  const { user } = useSupabaseAuth();
  const { targets, isLoading: targetsLoading, error: targetsError, save, reload: reloadTargets } = useNutritionTargets(user?.id);
  const [date, setDate] = useState(todayKey());
  const { entries, isLoading: entriesLoading, error: entriesError, addEntry, removeEntry } = useFoodEntries(user?.id, date);
  const [showSetup, setShowSetup] = useState(false);
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

  const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const caloriePct = targets ? Math.min(100, Math.round((totals.calories / targets.calorie_target) * 100)) : 0;
  const over = targets ? totals.calories > targets.calorie_target : false;

  return (
    <AppShell>
      <Seo title="Food — KOVA AI" description="Nutrition targets and a real food log connected to your KOVA training." path="/dashboard/food" />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Nutrition</p>
            <h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Food.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">Real macro targets and a daily log. Everything saved to your Supabase profile — no fake numbers.</p>
          </div>
          <button type="button" onClick={() => setShowSetup(true)} className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]">
            <Calculator className="size-4" />Recalculate targets
          </button>
        </div>

        {targetsError && <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your targets: {targetsError}</p>}

        {targetsLoading ? (
          <p className="mt-12 flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your nutrition…</p>
        ) : showSetup || !targets ? (
          <div className="mt-10">
            <SetupForm onDone={(input) => void save(input).then(() => setShowSetup(false)).catch(() => undefined)} />
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

            {entriesError && <p className="mt-6 text-sm text-red-200">Could not load your log: {entriesError}</p>}
          </>
        )}
      </div>
    </AppShell>
  );
}
