import { ArrowLeft, CalendarDays, CheckCircle2, Dumbbell, Pencil, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function PlanDetail() {
  const { id } = useParams();
  const { user } = useSupabaseAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const { days, addDay } = useKovaPlanDays(id, user?.id);
  const [addingDay, setAddingDay] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [dayError, setDayError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !user?.id || !id) { setIsLoading(false); return; }
    void supabase.from("plans").select("*").eq("id", id).eq("user_id", user.id).maybeSingle().then((result) => {
      if (result.error) setError(result.error.message);
      setPlan(result.data);
      setIsLoading(false);
    });
  }, [id, user?.id]);

  const saveDay = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dayTitle.trim()) return;
    setDayError(null);
    try {
      await addDay({ day_of_week: dayIndex, title: dayTitle.trim(), is_rest_day: false, duration_minutes: null, notes: null });
      setDayTitle("");
      setAddingDay(false);
    } catch (cause) {
      setDayError(cause instanceof Error ? cause.message : "Could not save this day.");
    }
  };

  return <AppShell><Seo title={`${plan?.name ?? "Plan"} — KOVA AI`} description="Your KOVA AI training plan." path={`/dashboard/plan/${id ?? ""}`} /><div className="mx-auto max-w-6xl"><Link to="/dashboard/plan" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />All plans</Link>{isLoading ? <p className="mt-12 text-sm text-white/40">Loading your plan…</p> : error ? <p className="mt-12 text-sm text-red-200">Could not load this plan: {error}</p> : !plan ? <div className="mt-12 rounded-2xl border border-white/10 p-8 text-white/55">This plan could not be found.</div> : <><div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">{plan.source === "ai" ? "KOVA draft" : "Manual plan"} · {plan.status}</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">{plan.name}.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-white/45">Your answers are saved securely. Add days and exercises as your plan takes shape.</p></div><button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]"><Pencil className="size-4" />Edit plan</button></div><div className="mt-10 grid gap-4 lg:grid-cols-3"><section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 lg:col-span-2"><div className="flex items-center gap-3"><CalendarDays className="size-5 text-white/50" /><h2 className="font-serif text-3xl italic">Weekly plan</h2></div><div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => { const savedDay = days.find((candidate) => candidate.day_of_week === index); return <div key={day} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><p className="text-xs text-white/65">{day}</p><p className="mt-3 text-xs text-white/30">{savedDay?.title ?? "No workout added"}</p></div>; })}</div><button type="button" onClick={() => setAddingDay(true)} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"><Dumbbell className="size-4" />Add workout day</button>{addingDay && <form onSubmit={saveDay} className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[1fr_1.5fr_auto]"><select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))} className="h-11 rounded-xl border border-white/10 bg-[#0b0b0b] px-3 text-sm text-white">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input value={dayTitle} onChange={(event) => setDayTitle(event.target.value)} placeholder="Workout name" className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/25" /><button type="submit" className="h-11 rounded-xl bg-white px-4 text-xs font-semibold text-black">Save</button>{dayError && <p className="text-xs text-red-200 sm:col-span-3">{dayError}</p>}</form></section><section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><Sparkles className="size-5 text-white/50" /><h2 className="mt-7 font-serif text-3xl italic">Next step</h2><p className="mt-3 text-sm leading-6 text-white/40">This is a saved draft. Generate or add workout days when you are ready.</p><Link to="/dashboard/plan" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Continue setup <CheckCircle2 className="size-4" /></Link></section></div><section className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><div className="flex items-center gap-3"><Dumbbell className="size-5 text-white/50" /><h2 className="font-serif text-3xl italic">Exercises</h2></div><p className="mt-5 text-sm leading-7 text-white/40">No exercises have been added yet. KOVA will only show exercise data once it is selected for this plan.</p></section></>}</div></AppShell>;
}
