import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Plus, ScanLine, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CameraCapture } from "@/components/food/CameraCapture";
import { DetectedFoodRow } from "@/components/food/DetectedFoodRow";
import { useFoodAi, type DetectedFood } from "@/hooks/use-food-ai";
import { useFoodEntries, todayKey } from "@/hooks/use-nutrition";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_OPTIONS: Array<{ key: Meal; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

type Stage = "capture" | "preview" | "result";

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
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);

  const reset = () => {
    setStage("capture");
    setPreviewUrl(null);
    setFile(null);
    setItems([]);
    setNote("");
    setError(null);
  };

  const close = () => {
    onClose();
    window.setTimeout(reset, 250);
  };

  const handleFile = (next: File) => {
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
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setError(null);
    try {
      const result = await analyzeMeal(file, MEAL_OPTIONS.find((option) => option.key === selectedMeal)?.label);
      setItems(result.items);
      setNote(result.note);
      setStage("result");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not analyze this photo.");
    } finally {
      busyRef.current = false;
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
          fiber_g: item.fiber_g,
          sugar_g: item.sugar_g,
          sodium_mg: item.sodium_mg,
          source: "ai",
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
    setItems((current) => [...current, { name: "", grams: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0, confidence: 1, matched: false, imageUrl: null }]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label="Scan food with AI"
        >
          {/* Top bar */}
          <div className="relative z-20 shrink-0 bg-black px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ScanLine className="size-5 text-kova-amber" />
                <h2 className="font-serif text-xl italic tracking-[-0.03em] text-white">
                  {stage === "result" ? "AI estimate" : "Scan with AI"}
                </h2>
              </div>
              <button type="button" onClick={close} className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70" aria-label="Close scanner">
                <X className="size-4" />
              </button>
            </div>
            {/* Meal selector */}
            <div className="mt-2.5 flex gap-1.5">
              {MEAL_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedMeal(option.key)}
                  className={cn(
                    "flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors",
                    selectedMeal === option.key ? "border-white bg-white text-black" : "border-white/15 text-white/60",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camera stage — full-screen live preview */}
          {stage === "capture" && <CameraCapture active={open} onCaptured={handleFile} />}

          {/* Preview stage */}
          {stage === "preview" && previewUrl && (
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10">
                <img src={previewUrl} alt="Your meal" className="max-h-[46dvh] w-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 backdrop-blur-sm">
                    <Loader2 className="size-7 animate-spin text-white" />
                    <p className="text-sm font-medium text-white/90">Analyzing your meal…</p>
                    <p className="text-[11px] text-white/55">Matching against food databases — a few seconds</p>
                  </div>
                )}
              </div>
              {!isAnalyzing && (
                <>
                  {error && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-3.5 text-sm leading-5 text-red-200">{error}</p>}
                  <div className="mt-4 flex gap-2.5">
                    <button type="button" onClick={reset} className="h-12 flex-1 rounded-full border border-white/15 text-xs font-semibold uppercase tracking-[0.12em] text-white/65">Retake</button>
                    <button type="button" onClick={() => void analyze()} className="h-12 flex-[2] rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black">Analyze meal</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Result stage */}
          {stage === "result" && (
            <div className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <DetectedFoodRow
                    key={`${item.name}-${index}`}
                    item={item}
                    index={index}
                    onChange={(next) => setItems((current) => current.map((candidate, candidateIndex) => (candidateIndex === index ? next : candidate)))}
                    onRemove={() => setItems((current) => current.filter((_, candidateIndex) => candidateIndex !== index))}
                  />
                ))}
              </div>
              <button type="button" onClick={addEmptyRow} className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs text-white/45">
                <Plus className="size-3.5" />Add another food
              </button>

              <div className="mt-4 rounded-2xl border border-kova-amber/25 bg-kova-amber/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kova-amber">AI estimate</p>
                <p className="mt-1.5 text-2xl font-semibold text-white">{totals.calories.toLocaleString()} kcal</p>
                <p className="mt-1 text-xs text-white/55">{totals.protein}g protein · {totals.carbs}g carbs · {totals.fat}g fat</p>
                <p className="mt-2 text-[11px] leading-4 text-white/40">Nutrition values come from Open Food Facts / USDA based on the detected foods and portions. Review everything before adding.</p>
                {note && <p className="mt-1.5 text-[11px] leading-4 text-white/40">{note}</p>}
              </div>

              {error && <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/5 p-3.5 text-sm leading-5 text-red-200">{error}</p>}

              <div className="mt-4 flex gap-2.5">
                <button type="button" onClick={reset} disabled={saving} className="h-12 flex-1 rounded-full border border-white/15 text-xs font-semibold uppercase tracking-[0.12em] text-white/65 disabled:opacity-40">Scan again</button>
                <button type="button" onClick={() => void saveAll()} disabled={saving || !items.length} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Add all to {MEAL_OPTIONS.find((option) => option.key === selectedMeal)?.label}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
