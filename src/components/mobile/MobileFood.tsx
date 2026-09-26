import { motion } from "framer-motion";
import { Apple, Camera, Check, Globe2, Loader2, Plus, Sparkles, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DayNav } from "@/components/food/DayNav";
import { FoodEntryEditor } from "@/components/food/FoodEntryEditor";
import { FoodPicker, type FoodPickerEntry } from "@/components/food/FoodPicker";
import { NutritionOnboarding } from "@/components/food/NutritionOnboarding";
import { MobileFoodScanner } from "@/components/mobile/MobileFoodScanner";
import { buildInsight, todayKey, useFoodEntries, useNutritionTargets, type NutritionTargetInput } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: Array<{ key: Meal; label: string; icon: typeof Camera }> = [
  { key: "breakfast", label: "Breakfast", icon: Apple },
  { key: "lunch", label: "Lunch", icon: Utensils },
  { key: "dinner", label: "Dinner", icon: Utensils },
  { key: "snack", label: "Snacks", icon: Sparkles },
];

function ManualEntrySheet({
  open,
  meal,
  onClose,
  onSubmit,
}: {
  open: boolean;
  meal: Meal;
  onClose: () => void;
  onSubmit: (entry: { meal: Meal; name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }) => Promise<void>;
}) {
  const [selectedMeal, setSelectedMeal] = useState<Meal>(meal);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMeal(meal);
      setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setError(null);
    }
  }, [open, meal]);

  const submit = async () => {
    if (!name.trim() || !calories) {
      setError("A name and calories are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        meal: selectedMeal,
        name: name.trim(),
        calories: Math.max(0, Math.min(5000, Math.round(Number(calories) || 0))),
        protein_g: Math.max(0, Math.min(500, Math.round(Number(protein) || 0))),
        carbs_g: Math.max(0, Math.min(800, Math.round(Number(carbs) || 0))),
        fat_g: Math.max(0, Math.min(300, Math.round(Number(fat) || 0))),
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this meal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={false}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="liquid-glass absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[2rem] border-white/15 bg-[var(--surface-solid)] px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-white/20" />
        <h2 className="mt-4 font-serif text-2xl italic tracking-[-0.03em]">Add food manually</h2>
        <div className="mt-4 flex gap-1.5">
          {MEALS.map((option) => (
            <button key={option.key} type="button" onClick={() => setSelectedMeal(option.key)} className={cn("flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors", selectedMeal === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/50")}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2.5">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="What did you eat?" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
          <div className="grid grid-cols-2 gap-2.5">
            <input type="number" inputMode="numeric" min={0} value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="Calories" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
            <input type="number" inputMode="numeric" min={0} value={protein} onChange={(event) => setProtein(event.target.value)} placeholder="Protein (g)" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
            <input type="number" inputMode="numeric" min={0} value={carbs} onChange={(event) => setCarbs(event.target.value)} placeholder="Carbs (g)" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
            <input type="number" inputMode="numeric" min={0} value={fat} onChange={(event) => setFat(event.target.value)} placeholder="Fat (g)" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
          </div>
          {error && <p className="text-sm text-red-200">{error}</p>}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="h-12 flex-1 rounded-full border border-white/12 text-xs font-semibold uppercase tracking-[0.12em] text-white/60">Cancel</button>
            <button type="button" onClick={() => void submit()} disabled={saving} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save meal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MobileFood() {
  const { user } = useSupabaseAuth();
  const { targets, isLoading: targetsLoading, error: targetsError, save } = useNutritionTargets(user?.id);
  const [date, setDate] = useState(todayKey());
  const { entries, isLoading: entriesLoading, error, addEntry, updateEntry, removeEntry, reload } = useFoodEntries(user?.id, date);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<Meal>("breakfast");
  const [showSetup, setShowSetup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSetupDone = (input: NutritionTargetInput) => {
    setSaveError(null);
    void save(input)
      .then(() => setShowSetup(false))
      .catch((cause) => setSaveError(cause instanceof Error ? cause.message : "Could not save your targets."));
  };

  const handlePickerAdd = async (entry: FoodPickerEntry) => {
    await addEntry(entry);
  };

  const caloriePct = targets ? Math.min(100, Math.round((totals.calories / targets.calorie_target) * 100)) : 0;
  const over = targets ? totals.calories > targets.calorie_target : false;
  const isToday = date === todayKey();
  const dayLabel = isToday ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const editingEntry = entries.find((entry) => entry.id === editingId) ?? null;

  return (
    <div className="space-y-3.5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Nutrition</p>
        <h1 className="mt-2.5 font-serif text-[2.6rem] italic leading-[0.95] tracking-[-0.06em]">Food.</h1>
        <p className="mt-2 text-xs leading-5 text-white/40">Track your nutrition without the hassle.</p>
      </motion.div>

      <DayNav date={date} onChange={setDate} />

      {targetsLoading || entriesLoading ? (
        <div className="liquid-glass rounded-[1.4rem] p-5"><p className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your nutrition…</p></div>
      ) : !targets ? (
        <div className="liquid-glass rounded-[1.4rem] p-6 text-center">
          <Sparkles className="mx-auto size-5 text-kova-amber" />
          <h2 className="mt-4 font-serif text-3xl italic tracking-[-0.04em]">Set your nutrition</h2>
          <p className="mt-2 text-xs leading-5 text-white/45">Answer six quick questions and KOVA calculates your daily calorie and macro targets.</p>
          <button type="button" onClick={() => setShowSetup(true)} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black">
            <Sparkles className="size-4" />Start setup
          </button>
        </div>
      ) : (
        <>
          {/* Daily summary */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="liquid-glass rounded-[1.4rem] border-kova-amber/20 bg-kova-amber/[0.045] p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{dayLabel}'s nutrition</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-serif text-5xl italic tracking-[-0.05em]">{totals.calories.toLocaleString()}</p>
              <p className="text-xs text-white/40">
                {over ? `${totals.calories - targets.calorie_target} over target` : `${targets.calorie_target - totals.calories} kcal left`}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className={cn("h-full rounded-full transition-all duration-700", over ? "bg-kova-rose" : "bg-kova-amber")} style={{ width: `${caloriePct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[0.04] py-2"><p className="text-[9px] uppercase tracking-[0.14em] text-white/35">Protein</p><p className="mt-0.5 text-sm font-semibold text-kova-rose">{totals.protein}<span className="text-[10px] font-normal text-white/40">/{targets.protein_target}g</span></p></div>
              <div className="rounded-xl bg-white/[0.04] py-2"><p className="text-[9px] uppercase tracking-[0.14em] text-white/35">Carbs</p><p className="mt-0.5 text-sm font-semibold text-kova-sky">{totals.carbs}<span className="text-[10px] font-normal text-white/40">/{targets.carb_target}g</span></p></div>
              <div className="rounded-xl bg-white/[0.04] py-2"><p className="text-[9px] uppercase tracking-[0.14em] text-white/35">Fat</p><p className="mt-0.5 text-sm font-semibold text-kova-emerald">{totals.fat}<span className="text-[10px] font-normal text-white/40">/{targets.fat_target}g</span></p></div>
            </div>
          </motion.section>

          {/* Insight */}
          {insight && (
            <motion.p key={insight} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs leading-5 text-white/60">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-kova-amber" />{insight}
            </motion.p>
          )}

          {/* Primary actions */}
          <button type="button" onClick={() => setPickerOpen(true)} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[1.4rem] bg-white text-sm font-semibold text-black">
            <Globe2 className="size-5" />Add food
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setScannerOpen(true)} className="flex h-12 items-center justify-center gap-2 rounded-[1.4rem] border border-white/14 bg-white/[0.03] text-xs font-medium text-white/80">
              <Camera className="size-4" />Scan with AI
            </button>
            <button type="button" onClick={() => setManualOpen(true)} className="flex h-12 items-center justify-center gap-2 rounded-[1.4rem] border border-white/14 bg-white/[0.03] text-xs font-medium text-white/80">
              <Plus className="size-4" />Add manually
            </button>
          </div>

          {/* Meal sections */}
          {entries.length === 0 && !entriesLoading ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/[0.02] px-5 py-12 text-center">
              <Apple className="mx-auto size-6 text-white/25" />
              <h3 className="mt-4 font-serif text-2xl italic tracking-[-0.03em]">Nothing logged yet</h3>
              <p className="mx-auto mt-2 max-w-[260px] text-xs leading-5 text-white/40">Start tracking your meals to see your nutrition for {dayLabel.toLowerCase()}.</p>
              <button type="button" onClick={() => { setActiveMeal("breakfast"); setPickerOpen(true); }} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                <Plus className="size-4" />Add food
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {MEALS.map((section, sectionIndex) => {
                const sectionEntries = entries.filter((entry) => entry.meal === section.key);
                const sectionTotals = sectionEntries.reduce((sum, entry) => ({ calories: sum.calories + entry.calories, protein: sum.protein + entry.protein_g, carbs: sum.carbs + entry.carbs_g, fat: sum.fat + entry.fat_g }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                return (
                  <motion.section key={section.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + sectionIndex * 0.04 }} className="liquid-glass rounded-[1.4rem] p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-2xl italic tracking-[-0.03em]">{section.label}</h2>
                      {sectionEntries.length ? (
                        <span className="text-xs text-white/45">{sectionTotals.calories} kcal · {sectionTotals.protein}P · {sectionTotals.carbs}C · {sectionTotals.fat}F</span>
                      ) : (
                        <span className="text-xs text-white/30">Empty</span>
                      )}
                    </div>
                    {sectionEntries.length ? (
                      <ul className="mt-2 divide-y divide-white/[0.06]">
                        {sectionEntries.map((entry) => (
                          <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                            <button type="button" onClick={() => setEditingId(entry.id)} className="min-w-0 flex-1 text-left">
                              <p className="truncate text-sm text-white/85">{entry.name}</p>
                              <p className="mt-0.5 text-[11px] text-white/35">{entry.quantity ? `${entry.quantity} ${entry.unit || "g"} · ` : ""}P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g</p>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/55">{entry.calories} kcal</span>
                              <button type="button" onClick={() => setEditingId(entry.id)} className="flex size-8 items-center justify-center rounded-full text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label={`Edit ${entry.name}`}>
                                <Plus className="size-3.5 rotate-45" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button type="button" onClick={() => { setActiveMeal(section.key); setPickerOpen(true); }} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 text-xs text-white/40 hover:border-white/25 hover:text-white/65">
                      <Plus className="size-3.5" />Add to {section.label.toLowerCase()}
                    </button>
                  </motion.section>
                );
              })}
            </div>
          )}

          {targetsError && <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your targets: {targetsError}</p>}
          {error && <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your log: {error}</p>}
        </>
      )}

      <MobileFoodScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSaved={reload} meal={activeMeal} />
      <ManualEntrySheet open={manualOpen} meal={activeMeal} onClose={() => setManualOpen(false)} onSubmit={async (entry) => { await addEntry(entry); }} />
      <FoodPicker open={pickerOpen} meal={activeMeal} onMealChange={setActiveMeal} onClose={() => setPickerOpen(false)} onAdd={handlePickerAdd} />
      <FoodEntryEditor entry={editingEntry} onClose={() => setEditingId(null)} onUpdate={updateEntry} onDelete={removeEntry} />
      {showSetup && !targetsLoading && <NutritionOnboarding onDone={handleSetupDone} saving={targetsLoading} error={saveError} />}
    </div>
  );
}
