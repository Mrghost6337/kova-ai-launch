import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  Camera,
  ChefHat,
  Flame,
  Globe2,
  Plus,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassButton, GlassCard, SectionHeader } from "@/components/glass";
import { DayNav } from "@/components/food/DayNav";
import { FoodEntryEditor } from "@/components/food/FoodEntryEditor";
import { FoodPicker, type FoodPickerEntry } from "@/components/food/FoodPicker";
import { FoodScanDialog } from "@/components/food/FoodScanDialog";
import { NutritionOnboarding } from "@/components/food/NutritionOnboarding";
import { Seo } from "@/components/Seo";
import { buildInsight, todayKey, useFoodEntries, useNutritionTargets, type NutritionTargetInput } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: Array<{ key: Meal; label: string; icon: typeof Apple }> = [
  { key: "breakfast", label: "Breakfast", icon: Apple },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { key: "dinner", label: "Dinner", icon: ChefHat },
  { key: "snack", label: "Snacks", icon: Flame },
];

function MacroBar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="t-caption">{label}</span>
        <span className="t-caption">
          <span className="t-num text-white/85">{Math.round(value)}g</span> / {target}g
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full rounded-full bg-white/70 transition-all duration-700 [transition-timing-function:var(--ease-app)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onOpen,
}: {
  entry: { id: string; name: string; image_url: string | null; quantity: number | null; unit: string | null; calories: number; protein_g: number; carbs_g: number; fat_g: number };
  onOpen: () => void;
}) {
  const serving = entry.quantity ? `${entry.quantity} ${entry.unit || "g"} · ` : "";
  return (
    <li>
      <button type="button" onClick={onOpen} className="group flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
        <div className="flex min-w-0 items-center gap-3">
          {entry.image_url ? (
            <img src={entry.image_url} alt="" loading="lazy" className="size-9 shrink-0 rounded-lg border border-white/10 object-cover" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-semibold text-white/45">{entry.name.slice(0, 1).toUpperCase()}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-white/80">{entry.name}</p>
            <p className="t-caption mt-0.5">{serving}P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g</p>
          </div>
        </div>
        <span className="t-num shrink-0 text-sm text-white/55 transition-colors group-hover:text-white">{entry.calories} kcal</span>
      </button>
    </li>
  );
}

export default function Food() {
  const { user } = useSupabaseAuth();
  const { targets, isLoading: targetsLoading, error: targetsError, save } = useNutritionTargets(user?.id);
  const [date, setDate] = useState(todayKey());
  const { entries, isLoading: entriesLoading, error: entriesError, addEntry, updateEntry, removeEntry } = useFoodEntries(user?.id, date);
  const [showSetup, setShowSetup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [editing, setEditing] = useState<string | null>(null);

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

  const insight = useMemo(() => buildInsight(targets, entries), [targets, entries]);

  useEffect(() => {
    if (targetsLoading) return;
    setShowSetup(!targets);
  }, [targets, targetsLoading]);

  const handleAdd = async (entry: FoodPickerEntry) => {
    await addEntry(entry);
  };

  const handleSetupDone = (input: NutritionTargetInput) => {
    setSaveError(null);
    void save(input)
      .then(() => setShowSetup(false))
      .catch((cause) => setSaveError(cause instanceof Error ? cause.message : "Could not save your targets."));
  };

  const isToday = date === todayKey();
  const dayLabel = isToday
    ? "Today"
    : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const caloriePct = targets ? Math.min(100, Math.round((totals.calories / targets.calorie_target) * 100)) : 0;
  const over = targets ? totals.calories > targets.calorie_target : false;
  const editingEntry = entries.find((entry) => entry.id === editing) ?? null;

  return (
    <AppShell>
      <Seo title="Food — KOVA AI" description="Track your nutrition without the hassle — search the world's foods, scan meals with AI and hit your macros." path="/dashboard/food" />
      <AnimatePresence>
        {showSetup && !targetsLoading && <NutritionOnboarding onDone={handleSetupDone} saving={targetsLoading} error={saveError} />}
      </AnimatePresence>

      <FoodPicker open={pickerOpen} meal={meal} onMealChange={setMeal} onClose={() => setPickerOpen(false)} onAdd={handleAdd} />
      <FoodScanDialog open={scanOpen} meal={meal} onMealChange={setMeal} onClose={() => setScanOpen(false)} onSaved={() => undefined} onAdd={handleAdd} />
      <FoodEntryEditor entry={editingEntry} onClose={() => setEditing(null)} onUpdate={updateEntry} onDelete={removeEntry} />

      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="t-label">Nutrition</p>
            <h1 className="t-display mt-4">Food.</h1>
            <p className="t-body mt-4 max-w-lg">Track your nutrition without the hassle — search any food, scan your plate or log manually. KOVA does the math.</p>
          </div>
          <GlassButton variant="ghost" onClick={() => setShowSetup(true)}>
            <Sparkles className="size-4" />
            Recalculate targets
          </GlassButton>
        </motion.div>

        {targetsError && <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your targets: {targetsError}</p>}

        {targetsLoading ? (
          <div className="mt-12 space-y-4">
            <div className="skeleton h-56 rounded-[1.5rem]" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="skeleton h-44 rounded-[1.5rem]" />
              <div className="skeleton h-44 rounded-[1.5rem]" />
            </div>
          </div>
        ) : !targets ? (
          <GlassCard className="mt-10 p-8 text-center sm:p-14">
            <Sparkles className="mx-auto size-6 text-white/50" strokeWidth={1.6} />
            <h2 className="t-h1 mt-6">Let's set your nutrition.</h2>
            <p className="t-body mx-auto mt-3 max-w-md">Six quick questions — height, weight, activity and goal. KOVA turns them into daily calorie and macro targets.</p>
            <GlassButton variant="solid" size="lg" className="mt-8" onClick={() => setShowSetup(true)}>
              Start setup
              <ArrowRight className="size-4" />
            </GlassButton>
          </GlassCard>
        ) : (
          <>
            {/* Daily summary */}
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <GlassCard className="mt-10 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="t-h1">{dayLabel}</h2>
                    <p className="t-body mt-2">
                      {over
                        ? `${totals.calories - targets.calorie_target} kcal over target`
                        : `${targets.calorie_target - totals.calories} kcal remaining`}
                    </p>
                  </div>
                  <DayNav date={date} onChange={setDate} />
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
                  {/* Calorie ring — monochrome */}
                  <div className="relative mx-auto size-40">
                    <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={over ? "var(--accent-rose)" : "rgba(255,255,255,0.85)"}
                        strokeWidth="9" strokeLinecap="round"
                        strokeDasharray={`${(caloriePct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="t-metric text-3xl">{totals.calories.toLocaleString()}</span>
                      <span className="t-caption mt-1 text-[10px] uppercase tracking-[0.16em]">of {targets.calorie_target.toLocaleString()} kcal</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <MacroBar label="Protein" value={totals.protein} target={targets.protein_target} />
                    <MacroBar label="Carbs" value={totals.carbs} target={targets.carb_target} />
                    <MacroBar label="Fat" value={totals.fat} target={targets.fat_target} />
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <GlassButton variant="solid" onClick={() => setPickerOpen(true)}>
                        <Globe2 className="size-4" />
                        Log food
                      </GlassButton>
                      <GlassButton variant="ghost" onClick={() => setScanOpen(true)}>
                        <Camera className="size-4" />
                        Scan photo
                      </GlassButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.section>

            {/* Insight */}
            {insight && (
              <motion.p
                key={insight}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3.5 text-sm text-white/60"
              >
                <Sparkles className="size-4 shrink-0 text-white/45" />
                {insight}
              </motion.p>
            )}

            {/* Meals */}
            {entries.length === 0 && !entriesLoading ? (
              <GlassCard className="mt-4 px-6 py-14 text-center">
                <Apple className="mx-auto size-7 text-white/25" strokeWidth={1.6} />
                <h3 className="t-h1 mt-5">Nothing logged yet</h3>
                <p className="t-body mx-auto mt-2.5 max-w-sm">Start tracking your meals to see your nutrition for {dayLabel.toLowerCase()}.</p>
                <GlassButton
                  variant="solid"
                  size="lg"
                  className="mt-7"
                  onClick={() => {
                    setMeal("breakfast");
                    setPickerOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add food
                </GlassButton>
              </GlassCard>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {MEALS.map((section) => {
                  const sectionEntries = entries.filter((entry) => entry.meal === section.key);
                  const sectionTotals = sectionEntries.reduce(
                    (sum, entry) => ({ calories: sum.calories + entry.calories, protein: sum.protein + entry.protein_g, carbs: sum.carbs + entry.carbs_g, fat: sum.fat + entry.fat_g }),
                    { calories: 0, protein: 0, carbs: 0, fat: 0 },
                  );
                  return (
                    <GlassCard key={section.key} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
                            <section.icon className="size-4" strokeWidth={1.7} />
                          </span>
                          <h3 className="t-h2">{section.label}</h3>
                        </div>
                        <span className="t-caption">
                          {sectionEntries.length
                            ? `${sectionTotals.calories} kcal · ${sectionTotals.protein}P · ${sectionTotals.carbs}C · ${sectionTotals.fat}F`
                            : "Empty"}
                        </span>
                      </div>
                      {sectionEntries.length ? (
                        <ul className="mt-4 divide-y divide-white/[0.06]">
                          {sectionEntries.map((entry) => (
                            <EntryRow key={entry.id} entry={entry} onOpen={() => setEditing(entry.id)} />
                          ))}
                        </ul>
                      ) : null}
                      <div className={cn("flex gap-2", sectionEntries.length ? "mt-4" : "mt-5")}>
                        <button
                          type="button"
                          onClick={() => {
                            setMeal(section.key);
                            setPickerOpen(true);
                          }}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-2xl text-xs transition-colors",
                            sectionEntries.length
                              ? "border border-white/[0.1] py-2.5 text-white/45 hover:border-white/25 hover:text-white/75"
                              : "border border-dashed border-white/[0.14] py-5 text-white/35 hover:border-white/30 hover:text-white/65",
                          )}
                        >
                          <Plus className="size-3.5" />
                          Add to {section.label.toLowerCase()}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMeal(section.key);
                            setScanOpen(true);
                          }}
                          className="flex size-11 items-center justify-center self-center rounded-2xl border border-white/[0.1] text-white/45 transition-colors hover:border-white/25 hover:text-white/75"
                          aria-label={`Scan photo for ${section.label.toLowerCase()}`}
                        >
                          <Camera className="size-4" />
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}

            {entriesLoading && (
              <div className="mt-6 flex items-center gap-2 text-sm text-white/40">
                <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                Loading your log…
              </div>
            )}
            {entriesError && <p className="mt-6 text-sm text-red-200">Could not load your log: {entriesError}</p>}
          </>
        )}
      </div>
    </AppShell>
  );
}
