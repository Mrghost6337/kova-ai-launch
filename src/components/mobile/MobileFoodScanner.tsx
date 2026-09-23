import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ImageIcon, Loader2, Plus, ScanLine, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useFoodAi, type DetectedFood } from "@/hooks/use-food-ai";
import { useFoodEntries } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { todayKey } from "@/hooks/use-nutrition";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_OPTIONS: Array<{ key: Meal; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

type Stage = "capture" | "preview" | "result";

function FoodRow({
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
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-white/90">{item.name}</p>
          <p className="mt-1 text-xs text-white/40">
            {item.grams ? `${item.grams} g · ` : ""}{item.calories} kcal
          </p>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-white/50">
            {Math.round(item.confidence * 100)}%
          </span>
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

export function MobileFoodScanner({
  open,
  onClose,
  onSaved,
  meal,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  meal: Meal;
}) {
  const { user } = useSupabaseAuth();
  const { addEntry } = useFoodEntries(user?.id, todayKey());
  const { analyzeMeal, isAnalyzing } = useFoodAi();

  const [stage, setStage] = useState<Stage>("capture");
  const [selectedMeal, setSelectedMeal] = useState<Meal>(meal);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<DetectedFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage("capture");
    setPreviewUrl(null);
    setFile(null);
    setItems([]);
    setError(null);
  };

  const close = () => {
    onClose();
    window.setTimeout(reset, 250);
  };

  const handleFile = (next: File | undefined) => {
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("That file is not an image. Choose a photo of your meal.");
      return;
    }
    if (next.size > 8_000_000) {
      setError("That photo is too large (max 8 MB). Try another one.");
      return;
    }
    setError(null);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setStage("preview");
  };

  const analyze = async () => {
    if (!file) return;
    setError(null);
    try {
      const result = await analyzeMeal(file, MEAL_OPTIONS.find((option) => option.key === selectedMeal)?.label);
      setItems(result.items);
      setStage("result");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not analyze this photo.");
    }
  };

  const totals = items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein_g,
      carbs: sum.carbs + item.carbs_g,
      fat: sum.fat + item.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const saveAll = async () => {
    if (!items.length) return;
    setSaving(true);
    setError(null);
    try {
      for (const item of items) {
        await addEntry({
          meal: selectedMeal,
          name: item.name,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        });
      }
      toast(`${items.length} item${items.length === 1 ? "" : "s"} added to ${MEAL_OPTIONS.find((option) => option.key === selectedMeal)?.label.toLowerCase()}.`);
      onSaved();
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save these items.");
    } finally {
      setSaving(false);
    }
  };

  const addEmptyRow = () => {
    setItems((current) => [...current, { name: "", grams: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, confidence: 1 }]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black/75 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Scan food"
        >
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="liquid-glass mt-auto flex max-h-[94dvh] flex-col rounded-t-[2rem] border-white/15 bg-[var(--surface-solid)]"
          >
            {/* Grabber + header */}
            <div className="shrink-0 px-5 pb-3 pt-3">
              <span className="mx-auto block h-1 w-10 rounded-full bg-white/20" />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ScanLine className="size-5 text-kova-amber" />
                  <h2 className="font-serif text-2xl italic tracking-[-0.03em]">
                    {stage === "result" ? "Here's what KOVA found" : "Scan food"}
                  </h2>
                </div>
                <button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white" aria-label="Close scanner">
                  <X className="size-4" />
                </button>
              </div>
              {/* Meal selector — determines where items land */}
              <div className="mt-3 flex gap-1.5">
                {MEAL_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedMeal(option.key)}
                    className={cn(
                      "flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors",
                      selectedMeal === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/50",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
              {stage === "capture" && (
                <div className="pb-4">
                  <p className="text-sm leading-6 text-white/45">Take a photo of your meal and KOVA estimates the calories and macros. You review everything before it is saved.</p>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                  <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
                  <button type="button" onClick={() => cameraInputRef.current?.click()} className="mt-5 flex h-32 w-full flex-col items-center justify-center gap-2.5 rounded-[1.5rem] border border-white/12 bg-white/[0.035] transition-colors hover:bg-white/[0.06]">
                    <Camera className="size-6 text-white/70" />
                    <span className="text-sm font-medium text-white/85">Scan Food</span>
                    <span className="text-[11px] text-white/35">Opens your camera</span>
                  </button>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="mt-2.5 flex h-14 w-full items-center justify-center gap-2.5 rounded-[1.5rem] border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
                    <ImageIcon className="size-4 text-white/55" />
                    <span className="text-sm text-white/70">Choose from gallery</span>
                  </button>
                  {error && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-3.5 text-sm leading-5 text-red-200">{error}</p>}
                </div>
              )}

              {stage === "preview" && previewUrl && (
                <div className="pb-4">
                  <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10">
                    <img src={previewUrl} alt="Your meal" className="max-h-72 w-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm">
                        <Loader2 className="size-7 animate-spin text-white" />
                        <p className="text-sm font-medium text-white/90">Analyzing your meal…</p>
                        <p className="text-[11px] text-white/50">This usually takes a few seconds</p>
                      </div>
                    )}
                  </div>
                  {!isAnalyzing && (
                    <>
                      {error && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-3.5 text-sm leading-5 text-red-200">{error}</p>}
                      <div className="mt-4 flex gap-2.5">
                        <button type="button" onClick={reset} className="h-12 flex-1 rounded-full border border-white/12 text-xs font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white">Retake</button>
                        <button type="button" onClick={() => void analyze()} className="h-12 flex-[2] rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black">Analyze meal</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {stage === "result" && (
                <div className="pb-4">
                  <div className="space-y-2.5">
                    {items.map((item, index) => (
                      <FoodRow
                        key={`${item.name}-${index}`}
                        item={item}
                        index={index}
                        onChange={(next) => setItems((current) => current.map((candidate, candidateIndex) => (candidateIndex === index ? next : candidate)))}
                        onRemove={() => setItems((current) => current.filter((_, candidateIndex) => candidateIndex !== index))}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={addEmptyRow} className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs text-white/45 hover:border-white/30 hover:text-white/70">
                    <Plus className="size-3.5" />Add another food
                  </button>

                  {/* Total */}
                  <div className="mt-4 rounded-2xl border border-kova-amber/25 bg-kova-amber/[0.06] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kova-amber">Total</p>
                    <p className="mt-1.5 text-2xl font-semibold text-white">{totals.calories.toLocaleString()} kcal</p>
                    <p className="mt-1 text-xs text-white/55">{totals.protein}g protein · {totals.carbs}g carbs · {totals.fat}g fat</p>
                  </div>

                  {error && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-3.5 text-sm leading-5 text-red-200">{error}</p>}

                  <div className="mt-4 flex gap-2.5">
                    <button type="button" onClick={reset} disabled={saving} className="h-12 flex-1 rounded-full border border-white/12 text-xs font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white disabled:opacity-40">Scan again</button>
                    <button type="button" onClick={() => void saveAll()} disabled={saving || !items.length} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Add to {MEAL_OPTIONS.find((option) => option.key === selectedMeal)?.label.toLowerCase()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
