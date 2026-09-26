import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FoodEntry } from "@/hooks/use-nutrition";
import { cn } from "@/lib/utils";

type Meal = FoodEntry["meal"];

const MEALS: Array<{ key: Meal; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Opens when the user taps a logged food. Quantity is stored per 100 units, so
 * changing it rescales every macro from the entry's own per-100 baseline.
 */
export function FoodEntryEditor({
  entry,
  onClose,
  onUpdate,
  onDelete,
}: {
  entry: FoodEntry | null;
  onClose: () => void;
  onUpdate: (entryId: string, changes: { name?: string; meal?: Meal; quantity?: number; unit?: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; fiber_g?: number; sugar_g?: number; sodium_mg?: number }) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(100);
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = entry?.quantity && entry.quantity > 0 ? entry.quantity : 100;

  useEffect(() => {
    if (entry) {
      setQuantity(entry.quantity && entry.quantity > 0 ? entry.quantity : 100);
      setMeal(entry.meal);
      setError(null);
    }
  }, [entry]);

  // The entry was logged as `base` units of its own macros. Scale from there.
  const factor = quantity / base;
  const preview = entry
    ? {
        calories: Math.round(entry.calories * factor),
        protein_g: Math.round(entry.protein_g * factor),
        carbs_g: Math.round(entry.carbs_g * factor),
        fat_g: Math.round(entry.fat_g * factor),
        fiber_g: Math.round(entry.fiber_g * factor),
        sugar_g: Math.round(entry.sugar_g * factor),
        sodium_mg: Math.round(entry.sodium_mg * factor),
      }
    : null;

  const unit = entry?.unit || "g";

  const commit = async () => {
    if (!entry || !preview) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(entry.id, {
        meal,
        quantity,
        calories: preview.calories,
        protein_g: preview.protein_g,
        carbs_g: preview.carbs_g,
        fat_g: preview.fat_g,
        fiber_g: preview.fiber_g,
        sugar_g: preview.sugar_g,
        sodium_mg: preview.sodium_mg,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this entry.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!entry) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(entry.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this entry.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/70 backdrop-blur-2xl sm:items-center sm:px-4 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Edit food entry"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="liquid-glass w-full max-w-md rounded-t-[2rem] border-white/15 bg-[var(--surface-solid)] px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 sm:rounded-[2rem] sm:px-6 sm:pb-6"
          >
            <span className="mx-auto block h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            <div className="mt-3 flex items-center justify-between sm:mt-0">
              <div className="flex min-w-0 items-center gap-3">
                {entry.image_url ? (
                  <img src={entry.image_url} alt="" className="size-11 shrink-0 rounded-xl border border-white/10 object-cover" />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-semibold text-white/60">{entry.name.slice(0, 1).toUpperCase()}</span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-2xl italic tracking-[-0.03em]">{entry.name}</h2>
                  <p className="text-[11px] text-white/35">Logged in {MEALS.find((option) => option.key === entry.meal)?.label}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white" aria-label="Close editor">
                <X className="size-4" />
              </button>
            </div>

            {/* Quantity */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">How much did you eat?</p>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 10))} className="flex size-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white" aria-label="Decrease quantity">
                  <Minus className="size-4" />
                </button>
                <div className="text-center">
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Math.min(5000, Number(event.target.value) || 1)))}
                    className="w-24 bg-transparent text-center text-3xl font-semibold tracking-tight text-white outline-none"
                  />
                  <span className="ml-1 text-sm text-white/40">{unit}</span>
                </div>
                <button type="button" onClick={() => setQuantity((value) => Math.min(5000, value + 10))} className="flex size-11 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/[0.08] hover:text-white" aria-label="Increase quantity">
                  <Plus className="size-4" />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                {[base, 50, 100, 150, 200, 250].map((chip) => (
                  <button
                    key={`${chip}-${unit}`}
                    type="button"
                    onClick={() => setQuantity(chip)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] transition-colors",
                      quantity === chip ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:text-white",
                    )}
                  >
                    {chip} {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Move to another meal */}
            <div className="mt-3 flex gap-1.5">
              {MEALS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMeal(option.key)}
                  className={cn(
                    "flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    meal === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Recalculated preview */}
            {preview && (
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/20 p-3.5 text-center">
                <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">kcal</p><p className="mt-1 text-base font-semibold text-white">{preview.calories}</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">protein</p><p className="mt-1 text-base font-semibold text-kova-rose">{preview.protein_g}g</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">carbs</p><p className="mt-1 text-base font-semibold text-kova-sky">{preview.carbs_g}g</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">fat</p><p className="mt-1 text-base font-semibold text-kova-emerald">{preview.fat_g}g</p></div>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-200">{error}</p>}

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => void remove()}
                disabled={saving || deleting}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-red-300/25 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition-colors hover:bg-red-300/10 disabled:opacity-40"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete
              </button>
              <button
                type="button"
                onClick={() => void commit()}
                disabled={saving || deleting}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
