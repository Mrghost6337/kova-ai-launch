import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  Camera,
  ChefHat,
  Flame,
  Globe2,
  Loader2,
  Plus,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
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
      <button type="button" onClick={onOpen} className="group flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]">
        <div className="flex min-w-0 items-center gap-3">
          {entry.image_url ? (
            <img src={entry.image_url} alt="" loading="lazy" className="size-9 shrink-0 rounded-lg border border-white/10 object-cover" />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-semibold text-white/45">{entry.name.slice(0, 1).toUpperCase()}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-white/80">{entry.name}</p>
            <p className="mt-0.5 text-xs text-white/35">{serving}P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g</p>
          </div>
        </div>
        <span className="shrink-0 text-sm text-white/55 transition-colors group-hover:text-white">{entry.calories} kcal</span>
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
        {showSetup && !targetsLoading && (
          <NutritionOnboarding onDone={handleSetupDone} saving={targetsLoading} error={saveError} />
        )}
      </AnimatePresence>

      <FoodPicker open={pickerOpen} meal={meal} onMealChange={setMeal} onClose={() => setPickerOpen(false)} onAdd={handleAdd} />
      <FoodScanDialog
        open={scanOpen}
        meal={meal}
        onMealChange={setMeal}
        onClose={() => setScanOpen(false)}
        onSaved={() => undefined}
        onAdd={handleAdd}
      />
      <FoodEntryEditor
        entry={editingEntry}
        onClose={() => setEditing(null)}
        onUpdate={updateEntry}
        onDelete={removeEntry}
      />

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Nutrition</p>
            <h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Food.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">Track your nutrition without the hassle — search any food, scan your plate or log manually. KOVA does the math.</p>
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
            {/* Daily summary */}
            <section className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl italic">{dayLabel}</h2>
                  <p className="mt-1.5 text-sm text-white/40">
                    {over
                      ? `${totals.calories - targets.calorie_target} kcal over target`
                      : `${targets.calorie_target - totals.calories} kcal remaining`}
                  </p>
                </div>
                <DayNav date={date} onChange={setDate} />
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
                    <span className="text-3xl font-semibold">{totals.calories.toLocaleString()}</span>
                    <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/35">of {targets.calorie_target.toLocaleString()} kcal</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <MacroBar label="Protein" value={totals.protein} target={targets.protein_target} color="bg-kova-rose" />
                  <MacroBar label="Carbs" value={totals.carbs} target={targets.carb_target} color="bg-kova-sky" />
                  <MacroBar label="Fat" value={totals.fat} target={targets.fat_target} color="bg-kova-emerald" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                      <Globe2 className="size-4" />Log food
                    </button>
                    <button type="button" onClick={() => setScanOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/[0.06]">
                      <Camera className="size-4" />Scan photo
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Insight */}
            {insight && (
              <motion.p
                key={insight}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-3.5 text-sm text-white/60"
              >
                <Sparkles className="size-4 shrink-0 text-kova-amber" />{insight}
              </motion.p>
            )}

            {/* Meals */}
            {entries.length === 0 && !entriesLoading ? (
              <div className="mt-10 rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
                <Apple className="mx-auto size-7 text-white/25" />
                <h3 className="mt-5 font-serif text-3xl italic tracking-[-0.03em]">Nothing logged yet</h3>
                <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-white/40">Start tracking your meals to see your nutrition for {dayLabel.toLowerCase()}.</p>
                <button
                  type="button"
                  onClick={() => {
                    setMeal("breakfast");
                    setPickerOpen(true);
                  }}
                  className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-7 text-xs font-semibold uppercase tracking-[0.12em] text-black"
                >
                  <Plus className="size-4" />Add food
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {MEALS.map((section) => {
                  const sectionEntries = entries.filter((entry) => entry.meal === section.key);
                  const sectionTotals = sectionEntries.reduce(
                    (sum, entry) => ({ calories: sum.calories + entry.calories, protein: sum.protein + entry.protein_g, carbs: sum.carbs + entry.carbs_g, fat: sum.fat + entry.fat_g }),
                    { calories: 0, protein: 0, carbs: 0, fat: 0 },
                  );
                  return (
                    <section key={section.key} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-white/60"><section.icon className="size-4" /></span>
                          <h3 className="font-serif text-2xl italic">{section.label}</h3>
                        </div>
                        <span className="text-xs text-white/40">
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
                        <button type="button" onClick={() => { setMeal(section.key); setPickerOpen(true); }} className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-2xl text-xs transition-colors",
                          sectionEntries.length
                            ? "border border-white/12 py-2.5 text-white/45 hover:border-white/30 hover:text-white/70"
                            : "border border-dashed border-white/15 py-5 text-white/35 hover:border-white/30 hover:text-white/60",
                        )}>
                          <Plus className="size-3.5" />Add to {section.label.toLowerCase()}
                        </button>
                        <button type="button" onClick={() => { setMeal(section.key); setScanOpen(true); }} className="flex size-11 items-center justify-center self-center rounded-2xl border border-white/12 text-white/45 transition-colors hover:border-white/30 hover:text-white/70" aria-label={`Scan photo for ${section.label.toLowerCase()}`}>
                          <Camera className="size-4" />
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {entriesLoading && <p className="mt-6 flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your log…</p>}
            {entriesError && <p className="mt-6 text-sm text-red-200">Could not load your log: {entriesError}</p>}
          </>
        )}
      </div>
    </AppShell>
  );
}
