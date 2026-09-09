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
  Sparkles,
  Users,
  Utensils,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { GymMiniMap } from "@/components/GymMiniMap";
import { Seo } from "@/components/Seo";
import { useFriends } from "@/hooks/use-social";
import { formatDistance, haversineKm } from "@/lib/geo";
import { gymStatus } from "@/lib/opening-hours";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCompletedSets, useKovaPlanDays, useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{children}</p>;
}
function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

const shortWeek = ["M", "T", "W", "T", "F", "S", "S"];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
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
  const nextWorkout = useMemo(() => {
    if (!days.length) return undefined;
    return days.find((day) => day.day_of_week > todayIndex) ?? days[0];
  }, [days, todayIndex]);
  const recentSets = sets.filter((set) => new Date(set.completed_at).toDateString() === today.toDateString());
  const firstName = (profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there").split(" ")[0];
  const isLoading = plansLoading || setsLoading;

  const [showAllFriends, setShowAllFriends] = useState(false);
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => undefined,
      { timeout: 8000 },
    );
  }, []);
  const gymDistanceKm = useMemo(
    () =>
      userCoords && profile?.gym_lat != null && profile.gym_lng != null
        ? haversineKm(userCoords.lat, userCoords.lng, profile.gym_lat, profile.gym_lng)
        : null,
    [userCoords, profile?.gym_lat, profile?.gym_lng],
  );

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
            {/* Primary row — what to do today */}
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="liquid-glass relative overflow-hidden rounded-[1.5rem] border-kova-amber/20 bg-kova-amber/[0.04] p-5 sm:p-7 lg:col-span-2"
              >
                <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-kova-amber/15 blur-[90px]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Label>Today's focus</Label>
                    <h2 className="mt-4 font-serif text-[clamp(2.2rem,4.5vw,3.4rem)] italic leading-[0.95] tracking-[-0.05em]">{todaysWorkout?.title ?? "Choose your next session"}</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
                      {todaysWorkout
                        ? `${todaysWorkout.duration_minutes ? `${todaysWorkout.duration_minutes} minutes · ` : ""}Your scheduled workout for today. Open it, follow the exercises and log each set.`
                        : "There is no workout assigned to today yet. Open your plan to shape the week."}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      {todaysWorkout ? (
                        <Link to={`/dashboard/plan/${activePlan.id}`} className="group inline-flex h-11 items-center gap-2 rounded-full bg-kova-amber px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black">View workout <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>
                      ) : (
                        <Link to={`/dashboard/plan/${activePlan.id}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]">Open plan <ArrowRight className="size-4" /></Link>
                      )}
                      <span className="inline-flex items-center gap-2 text-xs text-white/30"><Dumbbell className="size-3.5 text-kova-amber" />{activePlan.name}</span>
                    </div>
                  </div>
                  <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-kova-amber/10 text-kova-amber sm:flex"><Dumbbell className="size-5" /></span>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="liquid-glass relative overflow-hidden rounded-[1.5rem] border-kova-emerald/20 bg-kova-emerald/[0.04] p-5 sm:p-7"
              >
                <div className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full bg-kova-emerald/15 blur-[80px]" />
                <div className="relative">
                  <Label>Today's progress</Label>
                  <div className="mt-6 flex items-end justify-between">
                    <p className="font-serif text-6xl italic tracking-[-0.06em]">{recentSets.length}</p>
                    <CheckCircle2 className="mb-2 size-6 text-kova-emerald" />
                  </div>
                  <p className="mt-2 text-xs text-white/35">sets logged today</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-kova-emerald/70" style={{ width: `${Math.min(100, (recentSets.length / Math.max(1, todaysWorkout?.duration_minutes ? 15 : 10)) * 100)}%` }} />
                  </div>
                  <Link to={`/dashboard/plan/${activePlan.id}`} className="mt-6 inline-flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-white/45 hover:text-white">Log sets <ChevronRight className="size-3" /></Link>
                </div>
              </motion.section>
            </div>

            {/* Secondary row — the week at a glance */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="liquid-glass rounded-[1.5rem] border-kova-sky/15 bg-kova-sky/[0.035] p-5">
                <div className="flex items-center gap-2.5"><CalendarDays className="size-4 text-kova-sky" /><Label>Weekly schedule</Label></div>
                <div className="mt-5 flex justify-between gap-1.5">
                  {shortWeek.map((day, index) => {
                    const saved = days.some((candidate) => candidate.day_of_week === index);
                    const isToday = index === todayIndex;
                    return (
                      <span key={`${day}-${index}`} title={day} className={`flex h-9 flex-1 items-center justify-center rounded-xl text-[11px] font-medium ${saved ? "bg-kova-sky/15 text-kova-sky" : "bg-white/[0.05] text-white/30"} ${isToday ? "ring-1 ring-kova-sky/50" : ""}`}>{day}</span>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-white/40">{days.length ? `${days.length} workout day${days.length === 1 ? "" : "s"} planned` : "No days added yet"}</p>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="liquid-glass rounded-[1.5rem] border-kova-violet/15 bg-kova-violet/[0.035] p-5">
                <div className="flex items-center gap-2.5"><Clock3 className="size-4 text-kova-violet" /><Label>Next session</Label></div>
                <p className="mt-5 truncate font-serif text-2xl italic tracking-[-0.03em]">{nextWorkout?.title ?? "No session yet"}</p>
                <p className="mt-2 text-xs text-white/40">{nextWorkout ? `${nextWorkout.duration_minutes ? `${nextWorkout.duration_minutes} min · ` : ""}${nextWorkout.is_rest_day ? "Rest day" : "Workout"}` : "Add a day to your plan"}</p>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="liquid-glass rounded-[1.5rem] border-kova-rose/15 bg-kova-rose/[0.035] p-5">
                <div className="flex items-center gap-2.5"><Flame className="size-4 text-kova-rose" /><Label>Consistency</Label></div>
                <p className="mt-5 font-serif text-4xl italic tracking-[-0.04em]">{sets.length}</p>
                <p className="mt-2 text-xs text-white/40">total sets logged</p>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="liquid-glass rounded-[1.5rem] p-5">
                <div className="flex items-center gap-2.5"><Waves className="size-4 text-white/50" /><Label>Recovery</Label></div>
                <p className="mt-5 font-serif text-4xl italic tracking-[-0.04em]">—</p>
                <p className="mt-2 text-xs text-white/35">Recovery data will appear here once sessions are logged.</p>
              </motion.section>
            </div>

            {/* Current plan + friends */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="liquid-glass rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <Label>Current plan</Label>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${activePlan.is_public ? "border-kova-emerald/25 text-kova-emerald" : "border-white/10 text-white/40"}`}>{activePlan.is_public ? "Public" : "Private"}</span>
                </div>
                <h2 className="mt-4 truncate font-serif text-3xl italic tracking-[-0.04em]">{activePlan.name}</h2>
                <p className="mt-3 text-sm leading-6 text-white/40">{activePlan.status === "draft" ? "Saved as a draft. Add sessions and exercises when you are ready." : "Your current KOVA plan is active."}</p>
                <Link to={`/dashboard/plan/${activePlan.id}`} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Edit plan <ArrowRight className="size-4" /></Link>
              </motion.section>

              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="liquid-glass rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5"><Users className="size-4 text-kova-sky" /><Label>Friends</Label></div>
                  {friends.length > 3 && (
                    <button type="button" onClick={() => setShowAllFriends((current) => !current)} className="text-xs font-medium uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-white">{showAllFriends ? "Show less" : "View all"}</button>
                  )}
                </div>
                {friendsLoading ? (
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/40"><span className="size-3 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />Loading…</div>
                ) : friends.length ? (
                  <div className="mt-4 space-y-1">
                    {friends.slice(0, showAllFriends ? undefined : 3).map((friend) => (
                      <Link key={friend.id} to={`/u/${encodeURIComponent(friend.username || friend.id)}`} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.05]">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="size-9 shrink-0 rounded-full border border-white/15 object-cover" />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kova-sky/15 text-xs font-semibold text-kova-sky">{initials(friend.display_name || friend.username || "K")}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-white/85">{friend.display_name || friend.username || "Athlete"}</span>
                          <span className="block truncate text-[11px] text-white/35">@{friend.username || "—"}</span>
                        </span>
                        <ChevronRight className="size-3.5 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-3.5">
                    <p className="text-xs text-white/45">No friends yet.</p>
                    <p className="mt-1 text-[11px] leading-4 text-white/30">Follow public athletes to see them here.</p>
                  </div>
                )}
              </motion.section>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="liquid-glass rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-center gap-2.5"><Sparkles className="size-4 text-kova-amber" /><Label>Next best action</Label></div>
                <p className="mt-4 text-sm leading-6 text-white/55">{todaysWorkout ? "Follow today's workout and log each set as you go. Small, consistent inputs make KOVA smarter." : "Add a workout day to your plan so your dashboard can tell you exactly what to do next."}</p>
                <Link to={`/dashboard/plan/${activePlan.id}`} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Continue <ArrowRight className="size-4" /></Link>
              </motion.section>
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className="liquid-glass rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex items-center gap-2.5"><Utensils className="size-4 text-white/50" /><Label>Nutrition</Label></div>
                <p className="mt-4 text-sm leading-6 text-white/45">No nutrition targets yet. Set calorie and protein goals in the Food tab when you are ready.</p>
              </motion.section>
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="liquid-glass rounded-[1.5rem] border-kova-emerald/15 bg-kova-emerald/[0.035] p-5 sm:p-6">
                <div className="flex items-center gap-2.5"><MapPin className="size-4 text-kova-emerald" /><Label>Your gym</Label></div>
                {profile?.gym_name && profile.gym_lat != null && profile.gym_lng != null ? (
                  <>
                    <h2 className="mt-4 truncate font-serif text-2xl italic tracking-[-0.03em]">{profile.gym_name}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${gymInfo.state === "open" ? "border-kova-emerald/30 bg-kova-emerald/10 text-kova-emerald" : gymInfo.state === "closed" ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/10 bg-white/[0.04] text-white/45"}`}>
                        <span className={`size-1.5 rounded-full ${gymInfo.state === "open" ? "bg-kova-emerald" : gymInfo.state === "closed" ? "bg-kova-rose" : "bg-white/40"}`} />
                        {gymInfo.statusLabel}
                      </span>
                      {gymInfo.nextChange && <span className="text-[11px] text-white/40">{gymInfo.nextChange}</span>}
                      {gymDistanceKm !== null && <span className="text-[11px] text-white/40">· {formatDistance(gymDistanceKm)} away</span>}
                    </div>
                    {gymInfo.hoursToday && <p className="mt-2 text-xs text-white/40">Today · {gymInfo.hoursToday}</p>}
                    <GymMiniMap
                      gym={{ name: profile.gym_name, lat: profile.gym_lat, lng: profile.gym_lng }}
                      className="mt-4 h-36 rounded-2xl border border-white/10"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${profile.gym_lat},${profile.gym_lng}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-black"><Navigation className="size-3.5" />Directions</a>
                      <Link to="/dashboard/settings" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-4 text-xs font-medium text-white/70 hover:bg-white/[0.06]">Change</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-sm leading-6 text-white/45">No gym selected yet. Pick your gym on the live map so KOVA knows where you train.</p>
                    <Link to="/dashboard/settings" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Set your gym <ArrowRight className="size-4" /></Link>
                  </>
                )}
              </motion.section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}