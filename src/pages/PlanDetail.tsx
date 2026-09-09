import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronUp, Copy, Dumbbell, Eye, Link2, LogOut, Pencil, Plus, Search, Share2, Sparkles, Trash2, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useKovaPlanDays, useKovaPlanExercises, useKovaPlans, type Plan, type PlanExercise } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useWorkoutSessions, fetchPlanById } from "@/hooks/use-social";
import { exerciseGifUrl, loadExercises, searchExercises, type Exercise } from "@/lib/exercises";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type ExerciseBrief = { id?: string; name: string; sets: number; reps: string; rest: number | null; exerciseId: string | null };

function ExerciseRow({
  exercise,
  index,
  total,
  editable,
  thumbnail,
  onOpen,
  onUpdate,
  onDelete,
  onMove,
}: {
  exercise: PlanExercise;
  index: number;
  total: number;
  editable: boolean;
  thumbnail?: string;
  onOpen: () => void;
  onUpdate: (changes: { sets?: number; reps?: string; rest_seconds?: number | null; notes?: string | null }) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [sets, setSets] = useState(exercise.sets);
  const [reps, setReps] = useState(exercise.reps);
  const [rest, setRest] = useState(exercise.rest_seconds ?? 90);
  const [notes, setNotes] = useState(exercise.notes ?? "");

  useEffect(() => {
    setSets(exercise.sets);
    setReps(exercise.reps);
    setRest(exercise.rest_seconds ?? 90);
    setNotes(exercise.notes ?? "");
  }, [exercise.sets, exercise.reps, exercise.rest_seconds, exercise.notes]);

  const commit = (changes: { sets?: number; reps?: string; rest_seconds?: number | null; notes?: string | null }) => {
    onUpdate(changes);
  };

  const restLabel = exercise.rest_seconds ? ` · ${exercise.rest_seconds} sec rest` : "";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 transition-colors hover:border-white/[0.16]">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpen} aria-label={`View ${exercise.exercise_name}`} className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-black">
          {thumbnail ? <img src={thumbnail} alt={`${exercise.exercise_name} demonstration`} loading="lazy" className="size-full object-cover opacity-85 transition-opacity hover:opacity-100" /> : <Dumbbell className="absolute inset-0 m-auto size-5 text-white/25" />}
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="flex items-baseline gap-2">
            <span className="text-xs text-white/30">0{index + 1}</span>
            <span className="truncate text-sm capitalize text-white/85 transition-colors hover:text-white">{exercise.exercise_name}</span>
          </span>
          <span className="mt-1 block text-xs text-white/40">{exercise.sets} sets · {exercise.reps} reps{restLabel}</span>
        </button>
        {editable ? (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="flex size-7 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.08] hover:text-white disabled:opacity-25" aria-label="Move up"><ChevronUp className="size-3.5" /></button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="flex size-7 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.08] hover:text-white disabled:opacity-25" aria-label="Move down"><ChevronDown className="size-3.5" /></button>
            <button type="button" onClick={onDelete} className="flex size-7 items-center justify-center rounded-full text-white/30 hover:bg-red-300/10 hover:text-red-200" aria-label="Remove exercise"><X className="size-3.5" /></button>
          </div>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45"><Eye className="size-3.5" />View</span>
        )}
      </div>
      {editable && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Sets</span>
          <input type="number" min={1} max={20} value={sets} onChange={(event) => setSets(Math.max(1, Number(event.target.value) || 1))} onBlur={() => commit({ sets })} className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Reps</span>
          <input value={reps} onChange={(event) => setReps(event.target.value)} onBlur={() => commit({ reps })} placeholder="8-12" className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Rest (s)</span>
          <input type="number" min={0} max={600} value={rest} onChange={(event) => setRest(Math.max(0, Number(event.target.value) || 0))} onBlur={() => commit({ rest_seconds: rest || null })} className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
        </label>
        <label className="col-span-3 block sm:col-span-1">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-white/30">Notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => commit({ notes: notes.trim() || null })} placeholder="Optional" className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-white/30" />
        </label>
      </div>}
    </div>
  );
}

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { days, addDay, updateDay, deleteDay } = useKovaPlanDays(id, user?.id);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>();
  const { exercises, addExercise, updateExercise, deleteExercise } = useKovaPlanExercises(selectedDayId, user?.id);
  const { updatePlan, deletePlan } = useKovaPlans(user?.id);
  const { logSession } = useWorkoutSessions(user?.id);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<"draft" | "active">("draft");
  const [addingDay, setAddingDay] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [dayDuration, setDayDuration] = useState(60);
  const [dayError, setDayError] = useState<string | null>(null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayTitle, setEditDayTitle] = useState("");
  const [editDayIndex, setEditDayIndex] = useState(0);
  const [editDayDuration, setEditDayDuration] = useState(60);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");
  const [detail, setDetail] = useState<ExerciseBrief | null>(null);
  const [dayExercises, setDayExercises] = useState<Record<string, ExerciseBrief[]>>({});
  const [logging, setLogging] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = Boolean(plan && user && plan.user_id === user.id);

  useEffect(() => {
    if (!supabase || !id) {
      setIsLoading(false);
      return;
    }
    void fetchPlanById(id).then((data) => {
      setPlan(data);
      setIsLoading(false);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load this plan."));
  }, [id, user?.id]);

  useEffect(() => {
    if (plan) {
      setNameDraft(plan.name);
      setStatusDraft(plan.status === "active" ? "active" : "draft");
    }
  }, [plan]);

  useEffect(() => {
    if (!selectedDayId && days[0]) setSelectedDayId(days[0].id);
  }, [days, selectedDayId]);

  const selectedDay = days.find((day) => day.id === selectedDayId);
  const exerciseResults = useMemo(() => searchExercises(catalog, exerciseQuery), [catalog, exerciseQuery]);
  const detailExercise = detail?.exerciseId ? catalog.find((candidate) => candidate.id === detail.exerciseId) ?? null : null;

  useEffect(() => {
    if (!supabase) return;
    void loadExercises().then(setCatalog).catch((cause) => setCatalogError(cause instanceof Error ? cause.message : "Could not load exercises."));
  }, []);

  useEffect(() => {
    if (!supabase || !days.length) { setDayExercises({}); return; }
    const dayIds = days.map((day) => day.id);
    let cancelled = false;
    void supabase
      .from("plan_exercises")
      .select("id, plan_day_id, exercise_name, exercise_id, sets, reps, rest_seconds")
      .in("plan_day_id", dayIds)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return;
        const grouped: Record<string, ExerciseBrief[]> = {};
        for (const row of data) {
          (grouped[row.plan_day_id] ??= []).push({
            id: row.id,
            name: row.exercise_name,
            sets: row.sets ?? 3,
            reps: row.reps ?? "8-12",
            rest: row.rest_seconds,
            exerciseId: row.exercise_id,
          });
        }
        setDayExercises(grouped);
      });
    return () => { cancelled = true; };
  }, [days]);

  useEffect(() => {
    if (!detail && !pickerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDetail(null); setPickerOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, pickerOpen]);

  const saveDay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dayTitle.trim()) return;
    setDayError(null);
    try {
      const created = await addDay({ day_of_week: dayIndex, title: dayTitle.trim(), is_rest_day: false, duration_minutes: dayDuration || null, notes: null });
      setSelectedDayId(created.id);
      setDayTitle("");
      setAddingDay(false);
    } catch (cause) { setDayError(cause instanceof Error ? cause.message : "Could not save this day."); }
  };

  const openPicker = async () => {
    setPickerOpen(true);
    if (catalog.length) return;
    try { setCatalog(await loadExercises()); }
    catch (cause) { setCatalogError(cause instanceof Error ? cause.message : "Could not load exercises."); }
  };

  const selectExercise = async (exercise: Exercise) => {
    if (!selectedDayId) return;
    setAddingExercise(true);
    try {
      await addExercise({ exercise_id: exercise.id, exercise_name: exercise.name, sort_order: exercises.length, sets: 3, reps: "8-12", rest_seconds: 90, notes: null });
      setPickerOpen(false);
    } catch (cause) { setCatalogError(cause instanceof Error ? cause.message : "Could not add this exercise."); }
    finally { setAddingExercise(false); }
  };

  const quickAddExercise = async () => {
    const name = quickAdd.trim();
    if (!name || !selectedDayId) return;
    setAddingExercise(true);
    try {
      await addExercise({ exercise_id: `manual-${Date.now()}`, exercise_name: name, sort_order: exercises.length, sets: 3, reps: "8-12", rest_seconds: 90, notes: null });
      setQuickAdd("");
    } catch (cause) { setCatalogError(cause instanceof Error ? cause.message : "Could not add this exercise."); }
    finally { setAddingExercise(false); }
  };

  const startEditingDay = (dayId: string) => {
    const day = days.find((candidate) => candidate.id === dayId);
    if (!day) return;
    setEditingDayId(dayId);
    setEditDayTitle(day.title);
    setEditDayIndex(day.day_of_week);
    setEditDayDuration(day.duration_minutes ?? 60);
  };

  const saveEditedDay = async () => {
    if (!editingDayId || !editDayTitle.trim()) return;
    try {
      await updateDay(editingDayId, { title: editDayTitle.trim(), day_of_week: editDayIndex, duration_minutes: editDayDuration || null });
      setEditingDayId(null);
    } catch (cause) { setDayError(cause instanceof Error ? cause.message : "Could not update this day."); }
  };

  const removeDay = async (dayId: string) => {
    try {
      await deleteDay(dayId);
      if (selectedDayId === dayId) setSelectedDayId(undefined);
      setEditingDayId(null);
    } catch (cause) { setDayError(cause instanceof Error ? cause.message : "Could not remove this day."); }
  };

  const savePlanChanges = async () => {
    if (!plan) return;
    try {
      const updated = await updatePlan(plan.id, { name: nameDraft.trim() || plan.name, status: statusDraft });
      setPlan(updated);
      setEditing(false);
      toast("Plan saved.");
    } catch (cause) { setDayError(cause instanceof Error ? cause.message : "Could not save changes."); }
  };

  const toggleShare = async () => {
    if (!plan) return;
    const next = !plan.is_public;
    try {
      const updated = await updatePlan(plan.id, { is_public: next });
      setPlan(updated);
      if (next) {
        const link = `${window.location.origin}/dashboard/plan/${plan.id}`;
        try { await navigator.clipboard.writeText(link); toast("Plan is now public — link copied."); }
        catch { toast("Plan is now public."); }
      } else {
        toast("Plan is now private.");
      }
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Could not update sharing."); }
  };

  const copyPlanLink = async () => {
    if (!plan) return;
    const link = `${window.location.origin}/dashboard/plan/${plan.id}`;
    try { await navigator.clipboard.writeText(link); toast("Link copied."); }
    catch { toast("Copy failed — link below."); }
  };

  const confirmDelete = async () => {
    if (!plan) return;
    setDeleting(true);
    try {
      await deletePlan(plan.id);
      toast("Plan deleted.");
      navigate("/dashboard/plan");
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Could not delete this plan."); }
    finally { setDeleting(false); setDeleteOpen(false); }
  };

  const logWorkout = async () => {
    if (!selectedDay || !exercises.length) return;
    setLogging(true);
    try {
      const completedSets = exercises.flatMap((exercise) =>
        Array.from({ length: Math.min(exercise.sets || 3, 12) }, (_, index) => ({ plan_exercise_id: exercise.id, set_number: index + 1 })),
      );
      await logSession(selectedDay.title, completedSets);
      toast(`"${selectedDay.title}" logged — ${completedSets.length} sets recorded.`);
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Could not log this session."); }
    finally { setLogging(false); }
  };

  const moveExercise = async (index: number, direction: -1 | 1) => {
    const target = exercises[index + direction];
    const current = exercises[index];
    if (!target || !current) return;
    try {
      await updateExercise(current.id, { sort_order: target.sort_order });
      await updateExercise(target.id, { sort_order: current.sort_order });
    } catch (cause) { toast(cause instanceof Error ? cause.message : "Could not reorder exercises."); }
  };

  return <AppShell>
    <Seo title={`${plan?.name ?? "Plan"} — KOVA AI`} description="Your KOVA AI training plan." path={`/dashboard/plan/${id ?? ""}`} />
    <div className="mx-auto max-w-6xl">
      <Link to="/dashboard/plan" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />All plans</Link>
      {isLoading ? <p className="mt-12 text-sm text-white/40">Loading this plan…</p> : error ? <p className="mt-12 text-sm text-red-200">Could not load this plan: {error}</p> : !plan ? <div className="mt-12 rounded-2xl border border-white/10 p-8 text-white/55">This plan could not be found, or it is private.</div> : <>
        {/* Header */}
        <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="eyebrow">{plan.source === "ai" ? "KOVA plan" : "Manual plan"} · {plan.status}{isOwner ? "" : " · shared with you"}</p>
            {editing && isOwner ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} className="h-12 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] px-4 font-serif text-3xl italic tracking-[-0.04em] text-white outline-none focus:border-white/30" />
                <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as "draft" | "active")} className="h-11 rounded-full border border-white/10 bg-[var(--surface-solid)] px-4 text-xs text-white outline-none">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            ) : (
              <h1 className="mt-3 truncate font-serif text-6xl italic tracking-[-0.08em]">{plan.name}.</h1>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <>
                <button type="button" onClick={() => { if (editing) void savePlanChanges(); else setEditing(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]">{editing ? <Check className="size-4" /> : <Pencil className="size-4" />}{editing ? "Save plan" : "Edit plan"}</button>
                <button type="button" onClick={() => void toggleShare()} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-xs font-semibold uppercase tracking-[0.12em] ${plan.is_public ? "border-kova-emerald/30 text-kova-emerald hover:bg-kova-emerald/5" : "border-white/15 text-white hover:bg-white/[0.06]"}`}>{plan.is_public ? <Share2 className="size-4" /> : <Link2 className="size-4" />}{plan.is_public ? "Public" : "Share"}</button>
                {plan.is_public && <button type="button" onClick={() => void copyPlanLink()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs text-white/60 hover:bg-white/[0.06]"><Copy className="size-4" />Copy link</button>}
                <button type="button" onClick={() => setDeleteOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-300/20 px-4 text-xs text-red-200/70 hover:bg-red-300/10 hover:text-red-200"><Trash2 className="size-4" />Delete</button>
              </>
            )}
            {!isOwner && <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs text-white/55"><LogOut className="size-4" />Read-only view</span>}
          </div>
        </div>

        {/* Week grid + day editor */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 lg:col-span-2">
            <div className="flex items-center gap-3"><CalendarDays className="size-5 text-white/50" /><h2 className="font-serif text-3xl italic">Weekly plan</h2></div>
            <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {week.map((day, index) => {
                const savedDay = days.find((candidate) => candidate.day_of_week === index);
                const isSelected = savedDay?.id === selectedDayId;
                const isEditingDay = savedDay?.id === editingDayId;
                return (
                  <div key={day} className={`relative rounded-2xl border p-4 text-left transition-colors ${isSelected ? "border-white/35 bg-white/[0.1]" : "border-white/[0.08] bg-black/20 hover:bg-white/[0.05]"}`}>
                    <button type="button" onClick={() => savedDay && setSelectedDayId(savedDay.id)} className="block w-full text-left">
                      <p className="text-xs text-white/65">{day}{isTodayIndex(index) && <span className="ml-1.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-black">today</span>}</p>
                      <p className="mt-3 text-xs text-white/45">{savedDay?.title ?? "No workout added"}</p>
                      {savedDay?.duration_minutes ? <p className="mt-1.5 text-[11px] text-white/30">{savedDay.duration_minutes} min</p> : null}
                    </button>
                    {savedDay && dayExercises[savedDay.id]?.length ? (
                      <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-2.5">
                        {dayExercises[savedDay.id].slice(0, 3).map((item) => (
                          <button type="button" key={item.id} onClick={() => { setSelectedDayId(savedDay.id); setDetail({ name: item.name, sets: item.sets, reps: item.reps, rest: item.rest, exerciseId: item.exerciseId }); }} className="block w-full truncate text-left text-[11px] capitalize text-white/55 transition-colors hover:text-white">
                            {item.name}
                          </button>
                        ))}
                        {dayExercises[savedDay.id].length > 3 && <p className="pt-0.5 text-[10px] text-white/30">+{dayExercises[savedDay.id].length - 3} more</p>}
                      </div>
                    ) : null}
                    {isOwner && savedDay && editing && (
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button type="button" onClick={() => startEditingDay(savedDay.id)} className="flex size-6 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.08] hover:text-white" aria-label="Edit day"><Pencil className="size-3" /></button>
                        <button type="button" onClick={() => void removeDay(savedDay.id)} className="flex size-6 items-center justify-center rounded-full text-white/30 hover:bg-red-300/10 hover:text-red-200" aria-label="Remove day"><X className="size-3" /></button>
                      </div>
                    )}
                    {isEditingDay && (
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                        <input value={editDayTitle} onChange={(event) => setEditDayTitle(event.target.value)} placeholder="Workout name" className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs text-white outline-none focus:border-white/30" />
                        <div className="flex gap-2">
                          <select value={editDayIndex} onChange={(event) => setEditDayIndex(Number(event.target.value))} className="h-9 flex-1 rounded-xl border border-white/10 bg-[var(--surface-solid)] px-2 text-xs text-white outline-none">{week.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
                          <input type="number" min={5} max={300} value={editDayDuration} onChange={(event) => setEditDayDuration(Number(event.target.value) || 60)} className="h-9 w-20 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-xs text-white outline-none focus:border-white/30" aria-label="Duration in minutes" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void saveEditedDay()} className="flex-1 rounded-xl bg-white py-2 text-[11px] font-semibold text-black">Save day</button>
                          <button type="button" onClick={() => setEditingDayId(null)} className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/50 hover:text-white">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {isOwner && <button type="button" onClick={() => setAddingDay((value) => !value)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"><Plus className="size-4" />Add workout day</button>}
            {isOwner && addingDay && <form onSubmit={saveDay} className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_1.5fr_auto]">
              <select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))} className="h-11 rounded-xl border border-white/10 bg-[var(--surface-solid)] px-3 text-sm text-white">{week.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
              <input value={dayTitle} onChange={(event) => setDayTitle(event.target.value)} placeholder="Workout name" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/25" />
              <input type="number" min={5} max={300} value={dayDuration} onChange={(event) => setDayDuration(Number(event.target.value) || 60)} placeholder="Min" className="h-11 w-20 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/25" aria-label="Duration in minutes" />
              <button type="submit" className="h-11 rounded-xl bg-white px-4 text-xs font-semibold text-black sm:col-span-3">Save day</button>
            </form>}
            {dayError && <p className="mt-4 text-xs text-red-200">{dayError}</p>}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6">
            <Sparkles className="size-5 text-kova-amber" />
            <h2 className="mt-7 font-serif text-3xl italic">Make it yours</h2>
            <p className="mt-3 text-sm leading-6 text-white/40">{isOwner ? "Rename days, change the order, adjust sets and reps — everything saves instantly. Log a session when you finish a workout." : "This plan was shared by its owner. You can view every day and exercise, but changes stay with the owner."}</p>
            {isOwner && selectedDay && exercises.length > 0 && (
              <button type="button" disabled={logging} onClick={() => void logWorkout()} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-kova-emerald px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">{logging ? "Logging…" : "Log this workout"}<CheckCircle2 className="size-4" /></button>
            )}
            <Link to="/dashboard/plan" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Back to plans <ArrowRight className="size-4" /></Link>
          </section>
        </div>

        {/* Exercises for selected day */}
        <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3"><Dumbbell className="size-5 text-kova-sky" /><h2 className="font-serif text-3xl italic">{selectedDay?.title ?? "Exercises"}</h2></div>
              <p className="mt-2 text-sm text-white/40">{selectedDay ? `${exercises.length} exercise${exercises.length === 1 ? "" : "s"} · ${exercises.reduce((sum, exercise) => sum + (exercise.sets || 0), 0)} total sets` : "Add a workout day first."}</p>
              {selectedDay && exercises.length > 0 && <p className="mt-1.5 text-xs text-white/30">Click an exercise to open the full guide — bigger demo, weight tips and technique.</p>}
            </div>
            {isOwner && selectedDay && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void openPicker()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black"><Dumbbell className="size-4" />Add exercise</button>
              </div>
            )}
          </div>

          {isOwner && selectedDay && (
            <div className="mt-5 flex gap-2">
              <input value={quickAdd} onChange={(event) => setQuickAdd(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void quickAddExercise(); }} placeholder="Quick add — type an exercise name and press Enter" className="h-10 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
              <button type="button" disabled={addingExercise} onClick={() => void quickAddExercise()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs font-medium text-white/70 hover:bg-white/[0.06] disabled:opacity-50"><Plus className="size-4" />Add</button>
            </div>
          )}

          {exercises.length ? <div className="mt-7 space-y-2">{exercises.map((exercise, index) => {
            const catalogExercise = catalog.find((candidate) => candidate.id === exercise.exercise_id) ?? null;
            return (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                total={exercises.length}
                editable={Boolean(isOwner && selectedDay)}
                thumbnail={catalogExercise ? exerciseGifUrl(catalogExercise) : undefined}
                onOpen={() => setDetail({ name: exercise.exercise_name, sets: exercise.sets ?? 3, reps: exercise.reps ?? "8-12", rest: exercise.rest_seconds, exerciseId: exercise.exercise_id })}
                onUpdate={(changes) => void updateExercise(exercise.id, changes).catch(() => toast("Could not save exercise changes."))}
                onDelete={() => void deleteExercise(exercise.id).catch(() => toast("Could not remove this exercise."))}
                onMove={(direction) => void moveExercise(index, direction)}
              />
            );
          })}</div> : <p className="mt-7 text-sm leading-7 text-white/40">{selectedDay ? "No exercises yet. Add them from the catalog or type a name above." : "Select a workout day above to see its exercises."}</p>}
        </section>
      </>}
    </div>

    {/* Exercise picker */}
    {pickerOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-md" onClick={() => setPickerOpen(false)}>
      <div className="flex min-h-full items-center justify-center p-5" onClick={(event) => event.stopPropagation()}>
      <div className="liquid-glass w-full max-w-2xl rounded-[2rem] border-white/15 bg-[var(--surface-solid)] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="eyebrow">Exercise catalog</p><h2 className="mt-3 font-serif text-4xl italic">Choose a movement.</h2></div>
          <button type="button" onClick={() => setPickerOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white" aria-label="Close exercise picker"><X className="size-4" /></button>
        </div>
        <label className="relative mt-7 block"><Search className="absolute left-4 top-3.5 size-4 text-white/35" /><input value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Search by name, muscle or equipment" className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" /></label>
        {catalogError && <p className="mt-4 text-sm text-red-200">{catalogError}</p>}
        {!catalog.length && !catalogError ? <p className="mt-8 text-sm text-white/40">Loading the exercise catalog…</p> : <>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/30">{exerciseResults.length} exercise{exerciseResults.length === 1 ? "" : "s"}</p>
          <div className="mt-3 grid gap-2">{exerciseResults.map((exercise) => <button type="button" key={exercise.id} disabled={addingExercise} onClick={() => void selectExercise(exercise)} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-2 text-left transition-colors hover:border-white/[0.16] hover:bg-white/[0.08] disabled:opacity-50"><img loading="lazy" src={exerciseGifUrl(exercise)} alt="" className="size-16 rounded-xl object-cover" /><span className="min-w-0"><span className="block truncate text-sm capitalize text-white/75">{exercise.name}</span><span className="mt-1 block text-xs capitalize text-white/35">{exercise.targetMuscles.join(" · ")} · {exercise.equipment.join(", ")}</span></span></button>)}</div>
        </>}
        <p className="mt-6 text-[10px] leading-5 text-white/25">Metadata and demonstrations are loaded on demand from the exercise-library repository. Verify its applicable license before commercial distribution.</p>
      </div>
      </div>
    </div>}

    {/* Exercise guide modal */}
    {detail && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 backdrop-blur-md" onClick={() => setDetail(null)}>
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          <div className="liquid-glass w-full max-w-3xl rounded-[2rem] border-white/15 bg-[var(--surface-solid)] p-5 sm:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">Exercise guide</p><h2 className="mt-3 font-serif text-4xl italic capitalize tracking-[-0.05em] sm:text-5xl">{detail.name}</h2></div>
              <button type="button" onClick={() => setDetail(null)} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white" aria-label="Close exercise guide"><X className="size-4" /></button>
            </div>
            <div className="mt-7 grid gap-6 sm:grid-cols-[0.85fr_1fr]">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black sm:aspect-[4/5] lg:aspect-auto lg:min-h-[20rem]">
                {detailExercise ? (
                  <img src={exerciseGifUrl(detailExercise)} alt={`${detailExercise.name} demonstration`} className="size-full object-cover" />
                ) : detail.exerciseId && !catalog.length && !catalogError ? (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center"><Dumbbell className="size-7 text-white/20" /><p className="text-xs leading-5 text-white/35">Loading the demonstration…</p></div>
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center"><Dumbbell className="size-7 text-white/20" /><p className="text-xs leading-5 text-white/35">No demonstration saved for this exercise. Use the catalog when you add it next time.</p></div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="glass-pill px-3.5 py-1.5 text-xs text-white/75">{detail.sets} sets</span>
                  <span className="glass-pill px-3.5 py-1.5 text-xs text-white/75">{detail.reps} reps</span>
                  {detail.rest ? <span className="glass-pill px-3.5 py-1.5 text-xs text-white/75">{detail.rest} sec rest</span> : null}
                </div>
                {detailExercise ? (
                  <>
                    <p className="mt-5 text-sm text-white/50">Target: <span className="capitalize text-white/80">{detailExercise.targetMuscles.join(", ")}</span></p>
                    <p className="mt-2 text-sm text-white/50">Equipment: <span className="capitalize text-white/80">{detailExercise.equipment.join(", ")}</span></p>
                  </>
                ) : null}
                <div className="mt-5 rounded-2xl border border-kova-amber/20 bg-kova-amber/[0.06] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kova-amber">Weight guide</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">Start with a weight that keeps your form clean for every rep. When you can finish the top of your rep range with one or two reps left in reserve, add 2.5–5 kg next session.</p>
                </div>
                {detailExercise ? (
                  <div className="mt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">How to do it</p>
                    <ol className="mt-3 space-y-2.5">
                      {detailExercise.instructions.map((instruction, step) => (
                        <li key={instruction} className="flex gap-3 text-sm leading-6 text-white/55"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[10px] text-white/50">{step + 1}</span><span>{instruction}</span></li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={() => setDetail(null)} className="mt-7 h-11 w-full rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black">Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Delete confirmation */}
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes “{plan?.name}”, its workout days and all its exercises. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep plan</AlertDialogCancel>
          <AlertDialogAction onClick={() => void confirmDelete()} disabled={deleting} className="bg-red-400 text-black hover:bg-red-300">{deleting ? "Deleting…" : "Delete plan"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </AppShell>;
}

function isTodayIndex(index: number) {
  return ((new Date().getDay() + 6) % 7) === index;
}