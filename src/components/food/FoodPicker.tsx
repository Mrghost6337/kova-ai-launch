import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  Barcode,
  Check,
  ChefHat,
  Flame,
  Globe2,
  Heart,
  History,
  Loader2,
  Minus,
  Pencil,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FOOD_CATEGORIES, findCategory } from "@/lib/food-categories";
import { useFoodHistory } from "@/hooks/use-nutrition";
import {
  availableUnits,
  formatServing,
  loadFavoriteFoods,
  loadRecentFoods,
  rememberFood,
  removeRecentFood,
  scaleResult,
  toggleFavoriteFood,
  UNIT_LABELS,
  type FoodSearchResult,
  type PortionUnit,
  type RecentFood,
} from "@/lib/food-search";
import { BarcodeCamera } from "@/components/food/BarcodeCamera";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { cn } from "@/lib/utils";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodPickerEntry = {
  meal: Meal;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  quantity?: number | null;
  unit?: string | null;
  food_id?: string | null;
  image_url?: string | null;
  source?: "search" | "barcode" | "ai" | "manual";
};

const MEALS: Array<{ key: Meal; label: string; icon: typeof Apple }> = [
  { key: "breakfast", label: "Breakfast", icon: Apple },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed },
  { key: "dinner", label: "Dinner", icon: ChefHat },
  { key: "snack", label: "Snacks", icon: Flame },
];

/** Dish words that trigger complete-dish suggestion chips while typing. */
const DISH_SUGGESTIONS: ReadonlyArray<{ query: string; label: string }> = [
  { query: "chicken and rice", label: "Chicken & rice" },
  { query: "lasagna", label: "Lasagna" },
  { query: "spaghetti bolognese", label: "Spaghetti bolognese" },
  { query: "pizza", label: "Pizza" },
  { query: "caesar salad", label: "Caesar salad" },
  { query: "chicken curry", label: "Chicken curry" },
  { query: "club sandwich", label: "Sandwich" },
  { query: "fried rice", label: "Fried rice" },
];

const DISH_WORDS = DISH_SUGGESTIONS.flatMap((item) => item.query.split(" "));

const ease = [0.22, 1, 0.36, 1] as const;

type Mode = "search" | "portion" | "barcode" | "manual";

/** Map a backend Food Engine result onto the client result shape. */
function toClientResult(item: {
  id: string;
  source: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  allergens?: string | null;
  servingGrams: number | null;
  pieceGrams?: number | null;
  unit: "g" | "ml";
  per100: { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number };
  dish?: boolean;
  estimate?: boolean;
}): FoodSearchResult {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    displayName: item.name,
    source: item.source,
    kcalPer100: item.per100.kcal,
    proteinPer100: item.per100.protein,
    carbsPer100: item.per100.carbs,
    fatPer100: item.per100.fat,
    fiberPer100: item.per100.fiber,
    sugarPer100: item.per100.sugar,
    sodiumPer100: item.per100.sodium,
    servingGrams: item.servingGrams,
    pieceGrams: item.pieceGrams ?? null,
    unit: item.unit,
    imageUrl: item.imageUrl,
    allergens: item.allergens ?? null,
    isDish: item.dish ?? false,
    isEstimate: item.estimate ?? false,
  };
}

const SOURCE_LABEL: Record<string, string> = {
  off: "Open Food Facts",
  usda: "USDA",
  dietly: "Dietly",
};

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px]">
      <span className="text-white/40">{label}</span>
      <span className={cn("font-medium", color)}>{value}g</span>
    </span>
  );
}

function FoodThumb({ food, size = "md" }: { food: FoodSearchResult; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-16 rounded-2xl" : "size-11 rounded-xl";
  if (food.imageUrl) {
    return (
      <img
        src={food.imageUrl}
        alt=""
        loading="lazy"
        className={cn(box, "shrink-0 border border-white/10 object-cover")}
        onError={(event) => {
          (event.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <span className={cn(box, "flex shrink-0 items-center justify-center bg-white/[0.06] text-white/40")}>
      <UtensilsCrossed className={size === "lg" ? "size-5" : "size-4"} />
    </span>
  );
}

function FavoriteButton({ food, favorites, onToggle, floating }: { food: FoodSearchResult; favorites: RecentFood[]; onToggle: (food: FoodSearchResult) => void; floating?: boolean }) {
  const isFavorite = favorites.some((item) => item.id === food.id);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle(food);
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full transition-colors",
        floating ? "absolute right-2 top-2 bg-black/45 text-white/85 backdrop-blur-sm" : "text-white/25 hover:bg-white/[0.06] hover:text-white/70",
        isFavorite && (floating ? "text-kova-rose" : "text-kova-rose"),
      )}
      aria-label={isFavorite ? `Remove ${food.displayName} from favorites` : `Add ${food.displayName} to favorites`}
    >
      <Heart className={cn("size-4", isFavorite && "fill-current")} />
    </button>
  );
}

export function FoodPicker({
  open,
  meal,
  onMealChange,
  onClose,
  onAdd,
}: {
  open: boolean;
  meal: Meal;
  onMealChange: (meal: Meal) => void;
  onClose: () => void;
  onAdd: (entry: FoodPickerEntry) => Promise<void>;
}) {
  const { user } = useSupabaseAuth();
  const frequent = useFoodHistory(user?.id, 8);
  const searchFoodsAction = useAction(api.foodData.searchFoods);
  const lookupBarcodeAction = useAction(api.foodData.lookupBarcode);
  const popularFoodsAction = useAction(api.foodData.popularFoods);
  const browseCategoryAction = useAction(api.foodData.browseCategory);

  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [popular, setPopular] = useState<FoodSearchResult[]>([]);
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [favorites, setFavorites] = useState<RecentFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Category browsing
  const [category, setCategory] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<FoodSearchResult[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Barcode
  const [barcode, setBarcode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcodeBusy, setBarcodeBusy] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  // Portion state for the selected food
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [amount, setAmount] = useState(100);
  const [portionUnit, setPortionUnit] = useState<PortionUnit>("g");
  const [times, setTimes] = useState(1);

  // Manual entry
  const [manual, setManual] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchToken = useRef(0);
  const activeCategory = findCategory(category);

  useEffect(() => {
    if (!open) return;
    setMode("search");
    setQuery("");
    setResults([]);
    setSearchNote(null);
    setSelected(null);
    setAmount(100);
    setPortionUnit("g");
    setTimes(1);
    setBarcode("");
    setCameraOpen(false);
    setManual({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setError(null);
    setSearchError(null);
    setRecents(loadRecentFoods());
    setFavorites(loadFavoriteFoods());
    setCategory(null);
    setCategoryResults([]);
    if (!popular.length) {
      void popularFoodsAction()
        .then((items) => setPopular(items.map(toClientResult)))
        .catch(() => setPopular([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced unified search through the Food Engine.
  useEffect(() => {
    if (mode !== "search") return;
    const token = ++searchToken.current;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchNote(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await searchFoodsAction({ query: trimmed });
        if (token !== searchToken.current) return;
        setResults(response.items.map(toClientResult));
        setSearchNote(response.note?.corrected ? `Searched for "${response.note.corrected}"` : null);
        setSearchError(response.items.length ? null : "Nothing found — try another name (e.g. 'chicken', 'banana', 'rice').");
      } catch (cause) {
        if (token !== searchToken.current) return;
        setResults([]);
        setSearchNote(null);
        setSearchError(cause instanceof Error ? cause.message : "Search failed.");
      } finally {
        if (token === searchToken.current) setSearching(false);
      }
    }, 420);
    return () => window.clearTimeout(timer);
  }, [query, mode]);

  // Category browse: cached server-side, instant on repeat taps.
  useEffect(() => {
    if (mode !== "search" || !category || query.trim()) return;
    let cancelled = false;
    setCategoryLoading(true);
    void browseCategoryAction({ category })
      .then((items) => {
        if (!cancelled) setCategoryResults(items.map(toClientResult));
      })
      .catch(() => {
        if (!cancelled) setCategoryResults([]);
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, query, mode]);

  const preview = useMemo(() => {
    if (!selected) return null;
    return scaleResult(selected, { amount, unit: portionUnit, times });
  }, [selected, amount, portionUnit, times]);

  const chooseFood = (food: FoodSearchResult) => {
    setSelected(food);
    if (food.servingGrams) {
      setPortionUnit("serving");
      setAmount(1);
    } else {
      setPortionUnit(food.unit);
      setAmount(100);
    }
    setTimes(1);
    setMode("portion");
  };

  const handleFavoriteToggle = (food: FoodSearchResult) => {
    const next = toggleFavoriteFood(food);
    setFavorites(next.favorites);
  };

  const quickAdd = async (food: FoodSearchResult, source: FoodPickerEntry["source"] = "search") => {
    const portion = scaleResult(food, { amount: food.servingGrams ?? 100, unit: food.unit, times: 1 });
    setError(null);
    try {
      await onAdd({
        meal,
        ...portion,
        quantity: portion.grams,
        unit: food.unit,
        food_id: food.id,
        image_url: food.imageUrl,
        source,
      });
      setRecents(rememberFood(food));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this food.");
    }
  };

  const commitPortion = async () => {
    if (!selected || !preview) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        meal,
        ...preview,
        quantity: Math.round(preview.grams),
        unit: portionUnit,
        food_id: selected.id,
        image_url: selected.imageUrl,
        source: "search",
      });
      setRecents(rememberFood(selected));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  };

  const runBarcodeLookup = async (value: string) => {
    setBarcodeBusy(true);
    setBarcodeError(null);
    try {
      const found = await lookupBarcodeAction({ barcode: value });
      if (!found) {
        setBarcodeError("Product not found. Search for it by name instead.");
        return;
      }
      chooseFood(toClientResult(found));
      setBarcode("");
      setCameraOpen(false);
    } catch (cause) {
      setBarcodeError(cause instanceof Error ? cause.message : "Barcode lookup failed.");
    } finally {
      setBarcodeBusy(false);
    }
  };

  const commitBarcode = async () => {
    await runBarcodeLookup(barcode);
  };

  const commitManual = async () => {
    if (!manual.name.trim() || !manual.calories) {
      setError("A name and calories are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        meal,
        name: manual.name.trim(),
        calories: Math.max(0, Math.min(5000, Math.round(Number(manual.calories) || 0))),
        protein_g: Math.max(0, Math.min(500, Math.round(Number(manual.protein) || 0))),
        carbs_g: Math.max(0, Math.min(800, Math.round(Number(manual.carbs) || 0))),
        fat_g: Math.max(0, Math.min(300, Math.round(Number(manual.fat) || 0))),
        source: "manual",
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this entry.");
    } finally {
      setSaving(false);
    }
  };

  const dishChips = useMemo(() => {
    const words = query.toLowerCase().split(" ").filter(Boolean);
    if (!words.length || !words.some((word) => DISH_WORDS.includes(word))) return [];
    return DISH_SUGGESTIONS.slice(0, 6);
  }, [query]);

  const selectedUnits = selected ? availableUnits(selected) : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-2xl sm:items-center sm:px-4 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Add food"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.4, ease }}
            className="liquid-glass flex max-h-[92dvh] w-full flex-col rounded-t-[2rem] border-white/15 bg-[var(--surface-solid)] sm:max-w-xl sm:rounded-[2rem]"
          >
            {/* Header */}
            <div className="shrink-0 px-5 pb-3 pt-4 sm:px-6">
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/20 sm:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {mode === "portion" ? (
                    <button
                      type="button"
                      onClick={() => setMode("search")}
                      className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-colors hover:text-white"
                      aria-label="Back to search"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <Globe2 className="size-5 text-kova-sky" />
                  )}
                  <h2 className="font-serif text-2xl italic tracking-[-0.03em]">
                    {mode === "search" && "Search foods"}
                    {mode === "portion" && "How much did you eat?"}
                    {mode === "barcode" && "Scan barcode"}
                    {mode === "manual" && "Add manually"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors hover:text-white"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Meal selector */}
              <div className="mt-3 flex gap-1.5">
                {MEALS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onMealChange(option.key)}
                    className={cn(
                      "flex-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors",
                      meal === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:text-white",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Mode tabs */}
              {mode === "search" && (
                <div className="mt-3 flex gap-1.5">
                  <button type="button" onClick={() => setMode("barcode")} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/55 transition-colors hover:text-white">
                    <Barcode className="size-3.5" />Barcode
                  </button>
                  <button type="button" onClick={() => setMode("manual")} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/55 transition-colors hover:text-white">
                    <Pencil className="size-3.5" />Manual
                  </button>
                </div>
              )}

              {/* Search input */}
              {mode === "search" && (
                <div className="mt-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search any food, brand or dish…"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                    />
                    {searching && <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />}
                    {!searching && query && (
                      <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white" aria-label="Clear">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  {searchNote && !searching && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-kova-sky/80">
                      <Sparkles className="size-3" />{searchNote}
                    </p>
                  )}
                </div>
              )}

              {/* Dish suggestion chips while typing dish-like queries */}
              {mode === "search" && dishChips.length > 0 && query.trim() && (
                <div className="mt-2 -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {dishChips.map((chip) => (
                    <button
                      key={chip.query}
                      type="button"
                      onClick={() => setQuery(chip.query)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-kova-amber/25 bg-kova-amber/[0.07] px-3 py-1.5 text-[11px] text-white/80 transition-colors hover:text-white"
                    >
                      <ChefHat className="size-3 text-kova-amber" />{chip.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Category filters */}
              {mode === "search" && (
                <div className="mt-3 -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(null);
                      setCategoryResults([]);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                      category === null ? "border-white bg-white text-black" : "border-white/10 text-white/55 hover:text-white",
                    )}
                  >
                    All
                  </button>
                  {FOOD_CATEGORIES.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setCategory(option.key)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                        category === option.key ? "border-white bg-white text-black" : "border-white/10 text-white/55 hover:text-white",
                      )}
                    >
                      <span className="mr-1">{option.emoji}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Barcode input + live camera */}
              {mode === "barcode" && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      autoFocus={!cameraOpen}
                      inputMode="numeric"
                      value={barcode}
                      onChange={(event) => setBarcode(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void commitBarcode();
                      }}
                      placeholder="8710398513003"
                      className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => void commitBarcode()}
                      disabled={barcodeBusy || barcode.replace(/\D/g, "").length < 6}
                      className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-black disabled:opacity-40"
                    >
                      {barcodeBusy ? <Loader2 className="size-4 animate-spin" /> : <Barcode className="size-4" />}Find
                    </button>
                  </div>
                  {barcodeError && <p className="mt-2 text-sm text-red-200">{barcodeError}</p>}
                  {!cameraOpen ? (
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-[11px] text-white/60 transition-colors hover:text-white"
                    >
                      <ScanLine className="size-3.5" />Scan with the camera
                    </button>
                  ) : (
                    <BarcodeCamera open={cameraOpen} onClose={() => setCameraOpen(false)} onDetected={(value) => setBarcode(value)} />
                  )}
                  <p className="mt-2 text-[11px] leading-4 text-white/30">Point the camera at a barcode, or type the digits below it. Products come from Open Food Facts worldwide.</p>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),18px)] pt-1 sm:px-6">
              {mode === "search" && (
                <>
                  {/* Favorites */}
                  {!query.trim() && favorites.length > 0 && (
                    <section className="mt-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                        <Heart className="size-3 fill-kova-rose text-kova-rose" />Favorites
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {favorites.map((item) => (
                          <button key={item.id} type="button" onClick={() => chooseFood(item)} className="max-w-[220px] truncate rounded-full border border-kova-rose/25 bg-kova-rose/[0.07] px-3.5 py-1.5 text-xs text-white/80 transition-colors hover:text-white">
                            {item.displayName}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Frequently logged — one tap re-opens the portion editor via search */}
                  {!query.trim() && !category && frequent.length > 0 && (
                    <section className="mt-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                        <History className="size-3" />Foods you eat often
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {frequent.map((item) => (
                          <button key={item.name} type="button" onClick={() => setQuery(item.name)} className="max-w-[220px] truncate rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/70 transition-colors hover:text-white">
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Recents — tap to open, + to one-tap add a serving */}
                  {!query.trim() && recents.length > 0 && (
                    <section className="mt-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                        <History className="size-3" />Recent foods
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {recents.slice(0, 10).map((item) => (
                          <span key={item.id} className="group inline-flex items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
                            <button type="button" onClick={() => chooseFood(item)} className="max-w-[200px] truncate py-1.5 pl-3.5 pr-2 text-xs text-white/70 transition-colors hover:text-white">
                              {item.displayName}
                            </button>
                            <button
                              type="button"
                              onClick={() => void quickAdd(item)}
                              className="flex h-full items-center px-2 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                              aria-label={`Add a serving of ${item.displayName}`}
                            >
                              <Plus className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecents(removeRecentFood(item.id))}
                              className="flex h-full items-center pr-2 text-white/20 transition-colors hover:text-red-200"
                              aria-label={`Remove ${item.displayName} from recents`}
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Category browse results */}
                  {!query.trim() && category && (
                    <section className="mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                          {activeCategory ? `${activeCategory.emoji} ${activeCategory.label}` : "Category"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(null);
                            setCategoryResults([]);
                          }}
                          className="text-[10px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white"
                        >
                          Clear
                        </button>
                      </div>
                      {categoryLoading ? (
                        <div className="mt-2 space-y-2">
                          {[0, 1, 2].map((index) => (
                            <div key={index} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                              <div className="size-11 animate-pulse rounded-xl bg-white/[0.05]" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" />
                                <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : categoryResults.length ? (
                        <ul className="mt-2 space-y-1">
                          {categoryResults.map((item) => (
                            <li key={item.id} className="relative">
                              <button type="button" onClick={() => chooseFood(item)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 pr-11 text-left transition-colors hover:bg-white/[0.05]">
                                <FoodThumb food={item} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-white/85">{item.displayName}</span>
                                  <span className="block truncate text-[11px] text-white/35">{item.brand ? `${item.brand} · ` : ""}{formatServing(item)} · {item.kcalPer100} kcal per 100 {item.unit}</span>
                                </span>
                                <Plus className="size-4 shrink-0 text-white/25" />
                              </button>
                              <FavoriteButton food={item} favorites={favorites} onToggle={handleFavoriteToggle} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-5 text-center text-sm text-white/40">Nothing in this category yet — try a search.</p>
                      )}
                    </section>
                  )}

                  {/* Popular suggestions */}
                  {!query.trim() && !category && (
                    <section className="mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Popular worldwide</p>
                      {popular.length ? (
                        <ul className="mt-2 space-y-1">
                          {popular.map((item) => (
                            <li key={item.id} className="relative">
                              <button type="button" onClick={() => chooseFood(item)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 pr-11 text-left transition-colors hover:bg-white/[0.05]">
                                <FoodThumb food={item} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-white/85">{item.displayName}</span>
                                  <span className="block truncate text-[11px] text-white/35">{item.brand ? `${item.brand} · ` : ""}{formatServing(item)} · {item.kcalPer100} kcal per 100 {item.unit}</span>
                                </span>
                                <Plus className="size-4 shrink-0 text-white/25" />
                              </button>
                              <FavoriteButton food={item} favorites={favorites} onToggle={handleFavoriteToggle} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 flex items-center gap-2 text-xs text-white/35"><Loader2 className="size-3.5 animate-spin" />Loading suggestions…</p>
                      )}
                    </section>
                  )}

                  {/* Search results */}
                  {query.trim().length >= 2 && (
                    <section className="mt-3">
                      {results.length > 0 && (
                        <ul className="space-y-1">
                          {results.map((item) => (
                            <li key={item.id} className="relative">
                              <button type="button" onClick={() => chooseFood(item)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 pr-11 text-left transition-colors hover:bg-white/[0.05]">
                                <FoodThumb food={item} />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="min-w-0 truncate text-sm text-white/85">{item.displayName}</span>
                                    {item.isDish && <ChefHat className="size-3 shrink-0 text-kova-amber" aria-label="Complete dish" />}
                                  </span>
                                  <span className="block truncate text-[11px] text-white/35">
                                    {item.brand ? `${item.brand} · ` : ""}{SOURCE_LABEL[item.source] ?? item.source} · {item.kcalPer100} kcal per 100 {item.unit}{item.servingGrams ? ` · ${item.servingGrams}${item.unit} serving` : ""}
                                  </span>
                                </span>
                                <Plus className="size-4 shrink-0 text-white/25" />
                              </button>
                              <FavoriteButton food={item} favorites={favorites} onToggle={handleFavoriteToggle} />
                            </li>
                          ))}
                        </ul>
                      )}
                      {!searching && searchError && <p className="py-6 text-center text-sm text-white/40">{searchError}</p>}
                      {searching && !results.length && (
                        <div className="space-y-2 py-2">
                          {[0, 1, 2, 3].map((index) => (
                            <div key={index} className="flex items-center gap-3 rounded-2xl px-2 py-2">
                              <div className="size-11 animate-pulse rounded-xl bg-white/[0.05]" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.05]" />
                                <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
                </>
              )}

              {/* Portion editor */}
              {mode === "portion" && selected && preview && (
                <div className="pb-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <FoodThumb food={selected} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate text-sm font-medium text-white/90">{selected.displayName}</span>
                        {selected.isDish && <ChefHat className="size-3.5 shrink-0 text-kova-amber" aria-label="Complete dish" />}
                      </p>
                      <p className="text-[11px] text-white/35">{selected.brand ? `${selected.brand} · ` : ""}{formatServing(selected)}</p>
                      <p className="mt-1 text-[11px] leading-4 text-white/45">
                        {selected.kcalPer100} kcal · {selected.proteinPer100}P · {selected.carbsPer100}C · {selected.fatPer100}F per 100 {selected.unit}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-white/25">Source: {SOURCE_LABEL[selected.source] ?? selected.source}</p>
                    </div>
                    <FavoriteButton food={selected} favorites={favorites} onToggle={handleFavoriteToggle} />
                  </div>

                  {(selected.isEstimate || selected.isDish) && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-kova-amber/90">
                      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                      {selected.isEstimate
                        ? "Estimated values from the source — treat them as an indication, not a measured label."
                        : "Complete dish: values are a database reference for a typical preparation, not this exact recipe."}
                    </p>
                  )}

                  {/* Unit selector — only units that make sense for this food */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedUnits.map((unitOption) => (
                      <button
                        key={unitOption}
                        type="button"
                        onClick={() => {
                          if (unitOption === portionUnit) return;
                          if (unitOption === "serving") setAmount(1);
                          else if (unitOption === "piece") setAmount(1);
                          else if (portionUnit === "serving" || portionUnit === "piece") setAmount(100);
                          setPortionUnit(unitOption);
                        }}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                          portionUnit === unitOption ? "border-white bg-white text-black" : "border-white/10 text-white/55 hover:text-white",
                        )}
                      >
                        {UNIT_LABELS[unitOption]}
                      </button>
                    ))}
                  </div>

                  {/* Quick portion chips */}
                  {(portionUnit === selected.unit || portionUnit === "g" || portionUnit === "ml") && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[50, 100, 150, 200, 250].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setPortionUnit(selected.unit);
                            setAmount(chip);
                          }}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                            portionUnit === selected.unit && amount === chip ? "border-white bg-white text-black" : "border-white/10 text-white/55 hover:text-white",
                          )}
                        >
                          {chip} {selected.unit}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Amount + times steppers */}
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Amount ({UNIT_LABELS[portionUnit]})</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StepperButton onClick={() => setAmount((value) => Math.max(portionUnit === "serving" || portionUnit === "piece" ? 1 : 1, value - (portionUnit === "g" || portionUnit === "ml" ? 10 : 1)))} label="Less" />
                        <div className="text-center">
                          <input
                            type="number"
                            min={1}
                            max={portionUnit === "kg" || portionUnit === "l" ? 3 : 3000}
                            step={portionUnit === "kg" || portionUnit === "l" ? 0.1 : 1}
                            value={amount}
                            onChange={(event) => {
                              const max = portionUnit === "kg" || portionUnit === "l" ? 3 : 3000;
                              setAmount(Math.max(0.1, Math.min(max, Number(event.target.value) || 1)));
                            }}
                            className="w-20 bg-transparent text-center text-3xl font-semibold tracking-tight text-white outline-none"
                          />
                        </div>
                        <StepperButton onClick={() => setAmount((value) => Math.min(portionUnit === "kg" || portionUnit === "l" ? 3 : 3000, value + (portionUnit === "g" || portionUnit === "ml" ? 10 : 1)))} label="More" plus />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">How many times</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StepperButton onClick={() => setTimes((value) => Math.max(1, value - 1))} label="Less" />
                        <div className="text-center">
                          <span className="text-3xl font-semibold tracking-tight text-white">{times}</span>
                          <span className="ml-1.5 text-sm text-white/40">×</span>
                        </div>
                        <StepperButton onClick={() => setTimes((value) => Math.min(20, value + 1))} label="More" plus />
                      </div>
                    </div>
                  </div>

                  {/* Live macro preview */}
                  <motion.div layout className="mt-4 rounded-2xl border border-kova-amber/25 bg-kova-amber/[0.06] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kova-amber">You're logging</p>
                    <div className="mt-1.5 flex flex-wrap items-end justify-between gap-2">
                      <p className="text-3xl font-semibold text-white">{preview.calories} <span className="text-sm font-normal text-white/50">kcal</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        <MacroPill label="P" value={preview.protein_g} color="text-kova-rose" />
                        <MacroPill label="C" value={preview.carbs_g} color="text-kova-sky" />
                        <MacroPill label="F" value={preview.fat_g} color="text-kova-emerald" />
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/40">
                      {preview.grams}{selected.unit} total · {preview.fiber_g}g fiber · {preview.sugar_g}g sugar · {preview.sodium_mg}mg sodium
                    </p>
                    {selected.allergens && (
                      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-4 text-white/50">
                        <span className="text-white/35">Allergens:</span> {selected.allergens}
                      </p>
                    )}
                  </motion.div>

                  {error && <p className="mt-3 text-sm text-red-200">{error}</p>}

                  <div className="mt-4 flex gap-2.5">
                    <button type="button" onClick={() => setMode("search")} className="h-12 flex-1 rounded-full border border-white/12 text-xs font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void commitPortion()}
                      disabled={saving}
                      className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Add to {MEALS.find((option) => option.key === meal)?.label}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual entry */}
              {mode === "manual" && (
                <div className="pb-4">
                  <div className="space-y-2.5">
                    <input value={manual.name} onChange={(event) => setManual((value) => ({ ...value, name: event.target.value }))} placeholder="What did you eat?" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <input type="number" min={0} inputMode="numeric" value={manual.calories} onChange={(event) => setManual((value) => ({ ...value, calories: event.target.value }))} placeholder="kcal" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                      <input type="number" min={0} inputMode="numeric" value={manual.protein} onChange={(event) => setManual((value) => ({ ...value, protein: event.target.value }))} placeholder="Protein g" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                      <input type="number" min={0} inputMode="numeric" value={manual.carbs} onChange={(event) => setManual((value) => ({ ...value, carbs: event.target.value }))} placeholder="Carbs g" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                      <input type="number" min={0} inputMode="numeric" value={manual.fat} onChange={(event) => setManual((value) => ({ ...value, fat: event.target.value }))} placeholder="Fat g" className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
                    </div>
                  </div>
                  {error && <p className="mt-3 text-sm text-red-200">{error}</p>}
                  <div className="mt-4 flex gap-2.5">
                    <button type="button" onClick={() => setMode("search")} className="h-12 flex-1 rounded-full border border-white/12 text-xs font-semibold uppercase tracking-[0.12em] text-white/60 hover:text-white">Back</button>
                    <button type="button" onClick={() => void commitManual()} disabled={saving} className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Add to {MEALS.find((option) => option.key === meal)?.label}
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

function StepperButton({ onClick, label, plus }: { onClick: () => void; label: string; plus?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-white/10 text-lg text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      {plus ? <Plus className="size-4" /> : <Minus className="size-4" />}
    </button>
  );
}
