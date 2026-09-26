import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { DetectedFood } from "@/hooks/use-food-ai";
import { cn } from "@/lib/utils";

/**
 * One detected food from the AI scan: image thumb (when the database match
 * has one), estimated quantity and database-derived nutrition. Expandable
 * for manual correction — essential for unmatched items, which arrive with
 * zero values and must be editable before saving.
 */
export function DetectedFoodRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: DetectedFood;
  index: number;
  onChange: (next: DetectedFood) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
    >
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" className="size-11 shrink-0 rounded-xl border border-white/10 object-cover" />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-semibold text-white/45">{item.name.slice(0, 1).toUpperCase()}</span>
        )}
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-white/90">
            {item.name}
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]",
                item.matched ? "bg-kova-emerald/15 text-kova-emerald" : "bg-kova-amber/15 text-kova-amber",
              )}
            >
              {item.matched ? "db match" : "needs value"}
            </span>
          </p>
          <p className="mt-1 text-xs text-white/40">
            {item.grams ? `${item.grams} g · ` : ""}{item.calories} kcal · {Math.round(item.confidence * 100)}%
          </p>
        </button>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setOpen((value) => !value)} className="flex size-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.06] hover:text-white" aria-label={`Edit ${item.name}`}>
            <Pencil className="size-3.5" />
          </button>
          <button type="button" onClick={onRemove} className="flex size-8 items-center justify-center rounded-full text-white/30 hover:bg-red-300/10 hover:text-red-200" aria-label={`Remove ${item.name}`}>
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-[11px] text-white/45">P {item.protein_g}g · C {item.carbs_g}g · F {item.fat_g}g</p>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.08] pt-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Food</span>
                <input value={item.name} onChange={(event) => onChange({ ...item, name: event.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Quantity (g)</span>
                <input type="number" min={0} value={item.grams || ""} onChange={(event) => onChange({ ...item, grams: Math.max(0, Number(event.target.value) || 0) })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">kcal</span>
                <input type="number" min={0} value={item.calories || ""} onChange={(event) => onChange({ ...item, calories: Math.max(0, Number(event.target.value) || 0) })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Protein (g)</span>
                <input type="number" min={0} value={item.protein_g || ""} onChange={(event) => onChange({ ...item, protein_g: Math.max(0, Number(event.target.value) || 0) })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Carbs (g)</span>
                <input type="number" min={0} value={item.carbs_g || ""} onChange={(event) => onChange({ ...item, carbs_g: Math.max(0, Number(event.target.value) || 0) })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Fat (g)</span>
                <input type="number" min={0} value={item.fat_g || ""} onChange={(event) => onChange({ ...item, fat_g: Math.max(0, Number(event.target.value) || 0) })} className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
