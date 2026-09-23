import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  MapPin,
  Navigation,
  Plus,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { GymMiniMap } from "@/components/GymMiniMap";
import { useFriends } from "@/hooks/use-social";
import { formatDistance, haversineKm } from "@/lib/geo";
import { gymStatus } from "@/lib/opening-hours";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCompletedSets, useKovaPlanDays, useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function Card({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("liquid-glass rounded-[1.4rem] p-5", className)}
    >
      {children}
    </motion.section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{children}</p>;
}

const shortWeek = ["M", "T", "W", "T", "F", "S", "S"];

export function MobileHome() {
  const { user } = useSupabaseAuth();
  const { plans, isLoading: plansLoading } = useKovaPlans(user?.id);
  const { profile } = useKovaProfile(user?.id);
  const { sets, isLoading: setsLoading } = useCompletedSets(user?.id);
  const activePlan = plans.find((plan) => plan.status === "active") ?? plans.find((plan) => plan.status === "draft") ?? plans[0];
  const { days } = useKovaPlanDays(activePlan?.id, user?.id);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const todaysWorkout = days.find((day) => day.day_of_week === todayIndex);
  const nextWorkout = useMemo(() => (days.length ? days.find((day) => day.day_of_week > todayIndex) ?? days[0] : undefined), [days, todayIndex]);
  const recentSets = sets.filter((set) => new Date(set.completed_at).toDateString() === today.toDateString());
  const firstName = (profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const isLoading = plansLoading || setsLoading;

  const { friends, isLoading: friendsLoading } = useFriends(user?.id);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const gymInfo = useMemo(
    () => (profile?.gym_opening_hours ? gymStatus(profile.gym_opening_hours, now) : { state: "unknown" as const, statusLabel: "Hours unknown", hoursToday: null, nextChange: null }),
    [profile?.gym_opening_hours, now],
  );

  return (
    <div className="space-y-3.5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Label>Today · {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</Label>
        <h1 className="mt-2.5 font-serif text-[2.6rem] italic leading-[0.95] tracking-[-0.06em]">Hi {firstName}.</h1>
      </motion.div>

      {isLoading ? (
        <Card><p className="text-sm text-white/40">Loading your workspace…</p></Card>
      ) : !activePlan ? (
        <Card delay={0.06}>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-black"><Plus className="size-5" /></span>
          <h2 className="mt-5 font-serif text-3xl italic tracking-[-0.04em]">Create your first plan.</h2>
          <p className="mt-3 text-sm leading-6 text-white/45">Tell KOVA how you train and what you have access to. Skip anything you do not know yet.</p>
          <Link to="/dashboard/plan?create=1" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">Start plan maker <ArrowRight className="size-4" /></Link>
        </Card>
      ) : (
        <>
          {/* Today's focus */}
          <Card delay={0.06} className="border-kova-amber/20 bg-kova-amber/[0.05]">
            <Label>Today's focus</Label>
            <h2 className="mt-3 font-serif text-[2rem] italic leading-[0.98] tracking-[-0.04em]">{todaysWorkout?.title ?? "Choose your next session"}</h2>
            <p className="mt-2.5 text-sm leading-6 text-white/45">
              {todaysWorkout
                ? `${todaysWorkout.duration_minutes ? `${todaysWorkout.duration_minutes} min · ` : ""}Your scheduled workout for today.`
                : "No workout assigned to today yet. Open your plan to shape the week."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Link to={`/dashboard/plan/${activePlan.id}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-kova-amber px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black">
                {todaysWorkout ? "View workout" : "Open plan"} <ArrowRight className="size-4" />
              </Link>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/35"><Dumbbell className="size-3.5 text-kova-amber" />{activePlan.name}</span>
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3.5">
            <Card delay={0.1} className="border-kova-emerald/20 bg-kova-emerald/[0.045]">
              <div className="flex items-center justify-between"><Label>Today</Label><CheckCircle2 className="size-4 text-kova-emerald" /></div>
              <p className="mt-3 font-serif text-4xl italic tracking-[-0.04em]">{recentSets.length}</p>
              <p className="mt-1 text-[11px] text-white/35">sets logged</p>
            </Card>
            <Card delay={0.14} className="border-kova-violet/15 bg-kova-violet/[0.04]">
              <div className="flex items-center justify-between"><Label>Next</Label><Clock3 className="size-4 text-kova-violet" /></div>
              <p className="mt-3 truncate font-serif text-xl italic tracking-[-0.03em]">{nextWorkout?.title ?? "None yet"}</p>
              <p className="mt-1 text-[11px] text-white/35">{nextWorkout?.duration_minutes ? `${nextWorkout.duration_minutes} min` : "Add a day"}</p>
            </Card>
          </div>

          {/* Week strip */}
          <Card delay={0.18} className="border-kova-sky/15 bg-kova-sky/[0.04]">
            <div className="flex items-center gap-2.5"><CalendarDays className="size-4 text-kova-sky" /><Label>Weekly schedule</Label></div>
            <div className="mt-4 flex justify-between gap-1.5">
              {shortWeek.map((day, index) => {
                const saved = days.some((candidate) => candidate.day_of_week === index);
                const isToday = index === todayIndex;
                return (
                  <span key={`${day}-${index}`} className={cn("flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-medium", saved ? "bg-kova-sky/15 text-kova-sky" : "bg-white/[0.05] text-white/30", isToday && "ring-1 ring-kova-sky/50")}>{day}</span>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-white/40">{days.length ? `${days.length} workout day${days.length === 1 ? "" : "s"} planned` : "No days added yet"}</p>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3.5">
            <Link to="/dashboard/food" className="liquid-glass flex min-h-[86px] flex-col justify-between rounded-[1.4rem] border-kova-rose/15 bg-kova-rose/[0.04] p-4">
              <Utensils className="size-4 text-kova-rose" />
              <span className="mt-4 text-sm font-medium text-white/85">Log food</span>
            </Link>
            <Link to="/dashboard/plan" className="liquid-glass flex min-h-[86px] flex-col justify-between rounded-[1.4rem] border-kova-sky/15 bg-kova-sky/[0.04] p-4">
              <Dumbbell className="size-4 text-kova-sky" />
              <span className="mt-4 text-sm font-medium text-white/85">My plan</span>
            </Link>
          </div>

          {/* Gym */}
          <Card delay={0.22} className="border-kova-emerald/15 bg-kova-emerald/[0.035]">
            <div className="flex items-center gap-2.5"><MapPin className="size-4 text-kova-emerald" /><Label>Your gym</Label></div>
            {profile?.gym_name && profile.gym_lat != null && profile.gym_lng != null ? (
              <>
                <h2 className="mt-3.5 truncate font-serif text-2xl italic tracking-[-0.03em]">{profile.gym_name}</h2>
                <span className={cn("mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", gymInfo.state === "open" ? "border-kova-emerald/30 bg-kova-emerald/10 text-kova-emerald" : gymInfo.state === "closed" ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/10 bg-white/[0.04] text-white/45")}>
                  <span className={cn("size-1.5 rounded-full", gymInfo.state === "open" ? "bg-kova-emerald" : gymInfo.state === "closed" ? "bg-kova-rose" : "bg-white/40")} />
                  {gymInfo.statusLabel}
                </span>
                <GymMiniMap gym={{ name: profile.gym_name, lat: profile.gym_lat, lng: profile.gym_lng }} className="mt-3.5 h-32 rounded-2xl border border-white/10" />
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${profile.gym_lat},${profile.gym_lng}`} target="_blank" rel="noreferrer" className="mt-3.5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-black"><Navigation className="size-3.5" />Directions</a>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-white/45">No gym selected yet. Pick your gym on the live map.</p>
                <Link to="/dashboard/settings" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Set your gym <ArrowRight className="size-4" /></Link>
              </>
            )}
          </Card>

          {/* Friends */}
          <Card delay={0.26}>
            <div className="flex items-center gap-2.5"><Users className="size-4 text-kova-sky" /><Label>Friends</Label></div>
            {friendsLoading ? (
              <p className="mt-3 text-xs text-white/40">Loading…</p>
            ) : friends.length ? (
              <div className="mt-2 space-y-0.5">
                {friends.slice(0, 3).map((friend) => (
                  <Link key={friend.id} to={`/u/${encodeURIComponent(friend.username || friend.id)}`} className="flex items-center gap-3 rounded-xl px-1 py-2">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" className="size-9 shrink-0 rounded-full border border-white/15 object-cover" />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kova-sky/15 text-xs font-semibold text-kova-sky">{initials(friend.display_name || friend.username || "K")}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white/85">{friend.display_name || friend.username || "Athlete"}</span>
                      <span className="block truncate text-[11px] text-white/35">@{friend.username || "—"}</span>
                    </span>
                    <ChevronRight className="size-3.5 shrink-0 text-white/20" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-white/10 px-4 py-3.5">
                <p className="text-xs text-white/45">No friends yet.</p>
                <p className="mt-1 text-[11px] text-white/30">Follow public athletes to see them here.</p>
              </div>
            )}
          </Card>

          {/* Current plan */}
          <Card delay={0.3}>
            <div className="flex items-center justify-between">
              <Label>Current plan</Label>
              <span className={cn("rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]", activePlan.is_public ? "border-kova-emerald/25 text-kova-emerald" : "border-white/10 text-white/40")}>{activePlan.is_public ? "Public" : "Private"}</span>
            </div>
            <h2 className="mt-3.5 truncate font-serif text-2xl italic tracking-[-0.03em]">{activePlan.name}</h2>
            <Link to={`/dashboard/plan/${activePlan.id}`} className="mt-3.5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Edit plan <ArrowRight className="size-4" /></Link>
          </Card>
        </>
      )}
    </div>
  );
}
