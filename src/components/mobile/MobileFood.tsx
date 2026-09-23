import { motion } from "framer-motion";
import { Camera, Check, Loader2, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MobileFoodScanner } from "@/components/mobile/MobileFoodScanner";
import { computeTargets, todayKey, useFoodEntries, useNutritionTargets, type NutritionTargetInput } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEALS: Array<{ key: Meal; label: string; icon: typeof Camera }> = [
  { key: "breakfast", label: "Breakfast", icon: Camera },
  { key: "lunch", label: "Lunch", icon: Utensils },
  { key: "dinner", label: "Dinner", icon: Utensils },
  { key: "snack", label: "Snacks", icon: Sparkles },
];

type ManualStage = "closed" | "form";

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
  const { targets, isLoading: targetsLoading } = useNutritionTargets(user?.id);
  const [date] = useState(todayKey());
  const { entries, isLoading: entriesLoading, error, addEntry, removeEntry, reload } = useFoodEntries(user?.id, date);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<Meal>("breakfast");
  const [justSaved, setJustSaved] = useState(false);

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

  const handleManualSubmit = async (entry: { meal: Meal; name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }) => {
    await addEntry(entry);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1600);
  };

  const caloriePct = targets ? Math.min(100, Math.round((totals.calories / targets.calorie_target) * 100)) : 0;
  const over = targets ? totals.calories > targets.calorie_target : false;

  return (
    <div className="space-y-3.5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Nutrition</p>
        <h1 className="mt-2.5 font-serif text-[2.6rem] italic leading-[0.95] tracking-[-0.06em]">Food.</h1>
      </motion.div>

      {targetsLoading || entriesLoading ? (
        <div className="liquid-glass rounded-[1.4rem] p-5"><p className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="size-4 animate-spin" />Loading your nutrition…</p></div>
      ) : (
        <>
          {/* Today's nutrition — targets only shown when the user configured them */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="liquid-glass rounded-[1.4rem] border-kova-amber/20 bg-kova-amber/[0.045] p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Today's nutrition</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-serif text-5xl italic tracking-[-0.05em]">{totals.calories.toLocaleString()}</p>
              <p className="text-xs text-white/40">{targets ? (over ? `${totals.calories - targets.calorie_target} over target` : `${targets.calorie_target - totals.calories} kcal left`) : "kcal today"}</p>
            </div>
            {targets && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className={cn("h-full rounded-full transition-all duration-700", over ? "bg-kova-rose" : "bg-kova-amber")} style={{ width: `${caloriePct}%` }} />
              </div>
            )}
            <p className="mt-2.5 text-xs text-white/55">{totals.protein}g protein · {totals.carbs}g carbs · {totals.fat}g fat</p>
          </motion.section>

          {/* Primary actions */}
          <button type="button" onClick={() => setScannerOpen(true)} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[1.4rem] bg-white text-sm font-semibold text-black">
            <Camera className="size-5" />Scan Food
          </button>
          <button type="button" onClick={() => setManualOpen(true)} className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[1.4rem] border border-white/14 bg-white/[0.03] text-sm font-medium text-white/80">
            <Plus className="size-5" />Add manually
          </button>

          {/* Meal sections */}
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
                      <span className="text-xs text-white/30">Nothing logged</span>
                    )}
                  </div>
                  {sectionEntries.length ? (
                    <ul className="mt-2 divide-y divide-white/[0.06]">
                      {sectionEntries.map((entry) => (
                        <li key={entry.id} className="group flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/85">{entry.name}</p>
                            <p className="mt-0.5 text-[11px] text-white/35">P {entry.protein_g}g · C {entry.carbs_g}g · F {entry.fat_g}g</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/55">{entry.calories} kcal</span>
                            <button type="button" onClick={() => void removeEntry(entry.id).catch(() => undefined)} className="flex size-8 items-center justify-center rounded-full text-white/25 transition-colors hover:bg-red-300/10 hover:text-red-200" aria-label={`Remove ${entry.name}`}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <button type="button" onClick={() => { setActiveMeal(section.key); setManualOpen(true); }} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 text-xs text-white/40 hover:border-white/25 hover:text-white/65">
                    <Plus className="size-3.5" />Add to {section.label.toLowerCase()}
                  </button>
                </motion.section>
              );
            })}
          </div>

          {error && <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your log: {error}</p>}
        </>
      )}

      <MobileFoodScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSaved={reload} meal={activeMeal} />
      <ManualEntrySheet open={manualOpen} meal={activeMeal} onClose={() => setManualOpen(false)} onSubmit={handleManualSubmit} />
    </div>
  );
}
