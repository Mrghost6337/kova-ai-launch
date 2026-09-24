import { CalendarDays, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { Link } from "react-router";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useKovaPlans } from "@/hooks/use-kova-app";

/** Mobile list of the user's real plans — same data as the desktop Plan page. */
export function MobilePlan() {
  const { user } = useSupabaseAuth();
  const { plans, isLoading, error } = useKovaPlans(user?.id);

  return (
    <div className="space-y-3.5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Your training</p>
          <h1 className="mt-2.5 font-serif text-[2.6rem] italic leading-[0.95] tracking-[-0.06em]">Plan.</h1>
        </div>
        <Link to="/dashboard/plan?create=1" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-black">
          <Plus className="size-4" />New
        </Link>
      </div>

      {isLoading ? (
        <div className="liquid-glass rounded-[1.4rem] p-5"><p className="text-sm text-white/40">Loading your plans…</p></div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your plans: {error}</div>
      ) : plans.length === 0 ? (
        <div className="liquid-glass rounded-[1.6rem] p-6 text-center">
          <CalendarDays className="mx-auto size-6 text-white/45" />
          <h2 className="mt-5 font-serif text-3xl italic tracking-[-0.04em]">No plan yet.</h2>
          <p className="mt-2.5 text-sm leading-6 text-white/45">Start with a guided setup or create a blank plan.</p>
          <Link to="/dashboard/plan?create=1" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">Open plan maker <ChevronRight className="size-4" /></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Link key={plan.id} to={`/dashboard/plan/${plan.id}`} className="liquid-glass flex items-center justify-between gap-4 rounded-[1.4rem] p-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{plan.source === "ai" ? "KOVA draft" : "Manual"} · {plan.status}</p>
                <h2 className="mt-2 truncate font-serif text-2xl italic tracking-[-0.03em]">{plan.name}</h2>
                {plan.is_public && <span className="mt-1.5 inline-block rounded-full border border-kova-emerald/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-kova-emerald">Public</span>}
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/60">
                <Dumbbell className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
