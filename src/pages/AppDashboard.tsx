import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Plus,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCompletedSets, useKovaPlanDays, useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";

function Widget({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`liquid-glass rounded-[1.5rem] border-white/[0.1] bg-white/[0.035] p-5 sm:p-6 ${className}`}>{children}</section>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{children}</p>;
}
function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function AppDashboard() {
  const { user } = useSupabaseAuth();
  const { plans, isLoading: plansLoading } = useKovaPlans(user?.id);
  const { profile } = useKovaProfile(user?.id);
  const { sets, isLoading: setsLoading } = useCompletedSets(user?.id);
  const activePlan = plans.find((plan) => plan.status === "active") ?? plans.find((plan) => plan.status === "draft") ?? plans[0];
  const { days } = useKovaPlanDays(activePlan?.id, user?.id);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const todaysWorkout = days.find((day) => day.day_of_week === todayIndex);
  const recentSets = sets.filter((set) => new Date(set.completed_at).toDateString() === today.toDateString());
  const firstName = (profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const isLoading = plansLoading || setsLoading;

  return (
    <AppShell>
      <Seo title="Home — KOVA AI" description="Your personal KOVA AI training workspace." path="/dashboard" />
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Label>Today · {formatDate(today)}</Label>
            <h1 className="mt-3 max-w-3xl font-serif text-[clamp(2.8rem,6vw,5rem)] italic leading-[0.9] tracking-[-0.07em]">Good to see you, {firstName}.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">{todaysWorkout ? "Your next session is ready when you are." : activePlan ? "Your plan is here. Choose a day to keep building your week." : "Start with one clear next step. KOVA will build from there."}</p>
          </div>
          {activePlan && <Link to={`/dashboard/plan/${activePlan.id}`} className="group inline-flex h-11 items-center justify-center gap-3 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.02]">Open plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>}
        </motion.div>

        {isLoading ? <div className="mt-10 flex items-center gap-3 text-sm text-white/40"><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />Loading your workspace…</div> : !activePlan ? (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/[0.14] bg-white/[0.055] p-6 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-white/[0.07] blur-[90px]" />
            <div className="relative max-w-xl"><div className="flex size-12 items-center justify-center rounded-2xl bg-white text-black"><Plus className="size-5" /></div><h2 className="mt-7 font-serif text-4xl italic tracking-[-0.06em] sm:text-5xl">Create your first plan.</h2><p className="mt-4 text-sm leading-7 text-white/50">Tell KOVA how you train, what you want to achieve and what equipment you can use. You can skip anything you do not know yet.</p><Link to="/dashboard/plan?create=1" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:text-white/65">Start plan maker <ArrowRight className="size-4" /></Link></div>
          </motion.section>
        ) : (
          <>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
              <Widget className="min-h-[280px] bg-white/[0.055]">
                <div className="flex items-start justify-between gap-4"><div><Label>Today's focus</Label><h2 className="mt-5 font-serif text-4xl italic tracking-[-0.05em] sm:text-5xl">{todaysWorkout?.title ?? "Choose your next session"}</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/45">{todaysWorkout ? `${todaysWorkout.duration_minutes ? `${todaysWorkout.duration_minutes} minutes · ` : ""}Your scheduled workout for today.` : "There is no workout assigned to today yet. Open your plan to shape the week."}</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08]"><Dumbbell className="size-5 text-white/70" /></span></div>
                <div className="mt-10 flex flex-wrap items-center gap-3">{todaysWorkout ? <Link to={`/dashboard/plan/${activePlan.id}`} className="group inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black">View workout <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link> : <Link to={`/dashboard/plan/${activePlan.id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]">Open plan <ArrowRight className="size-4" /></Link>}<span className="text-xs text-white/30">{activePlan.name}</span></div>
              </Widget>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><Widget><Label>Today’s progress</Label><div className="mt-5 flex items-end justify-between"><p className="font-serif text-4xl italic">{recentSets.length}</p><CheckCircle2 className="mb-1 size-5 text-white/45" /></div><p className="mt-2 text-xs text-white/35">sets logged today</p></Widget><Widget><Label>Consistency</Label><div className="mt-5 flex items-end justify-between"><p className="font-serif text-4xl italic">{sets.length}</p><Flame className="mb-1 size-5 text-white/45" /></div><p className="mt-2 text-xs text-white/35">total sets logged</p></Widget></div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Widget><Label>Weekly schedule</Label><div className="mt-5 flex items-center gap-3"><CalendarDays className="size-5 text-white/45" /><p className="text-sm text-white/55">{days.length ? `${days.length} workout day${days.length === 1 ? "" : "s"} planned` : "No days added yet"}</p></div><Link to={`/dashboard/plan/${activePlan.id}`} className="mt-5 inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-white/45 hover:text-white">View week <ChevronRight className="size-3" /></Link></Widget>
              <Widget><Label>Workout duration</Label><div className="mt-5 flex items-center gap-3"><Clock3 className="size-5 text-white/45" /><p className="text-sm text-white/55">{todaysWorkout?.duration_minutes ? `${todaysWorkout.duration_minutes} min today` : "Not set yet"}</p></div></Widget>
              <Widget><Label>Recovery</Label><div className="mt-5 flex items-center gap-3"><Waves className="size-5 text-white/45" /><p className="text-sm text-white/45">No recovery data yet.</p></div></Widget>
              <Widget><Label>Nutrition</Label><div className="mt-5 flex items-center gap-3"><Utensils className="size-5 text-white/45" /><p className="text-sm text-white/45">Set targets in Food.</p></div></Widget>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Widget><div className="flex items-center justify-between"><div><Label>Plan status</Label><h2 className="mt-3 font-serif text-3xl italic">{activePlan.name}</h2></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/45">{activePlan.status}</span></div><p className="mt-4 text-sm leading-6 text-white/40">{activePlan.status === "draft" ? "Your plan is saved as a draft. Add sessions and exercises when you are ready." : "Your current KOVA plan is active."}</p></Widget>
              <Widget><div className="flex items-center gap-3"><Sparkles className="size-5 text-white/50" /><Label>Next best action</Label></div><p className="mt-5 text-sm leading-6 text-white/55">{todaysWorkout ? "Follow today’s workout and log each set as you go. Small, consistent inputs make KOVA smarter." : "Add a workout day to your plan so your dashboard can tell you exactly what to do next."}</p><Link to={`/dashboard/plan/${activePlan.id}`} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Continue <ArrowRight className="size-4" /></Link></Widget>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
