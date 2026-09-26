import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
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
import { Link, useNavigate } from "react-router";
import { AppShell } from "@/components/AppShell";
import { GlassButton, GlassCard, GlassProgress, SectionHeader } from "@/components/glass";
import { GymMiniMap } from "@/components/GymMiniMap";
import { Seo } from "@/components/Seo";
import { useFriends } from "@/hooks/use-social";
import { formatDistance, haversineKm } from "@/lib/geo";
import { gymStatus } from "@/lib/opening-hours";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCompletedSets, useKovaPlanDays, useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";

/* ————————————————————————————————————————————————————————————————————————
   Home — the KOVA command center. Real data only: today's scheduled workout,
   the week shape, sets the athlete actually logged and their real friends.
   ———————————————————————————————————————————————————————————————————————— */

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "K"
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Dumbbell;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="glass-chip h-11 flex-1 justify-center px-4 text-xs font-medium sm:flex-none"
    >
      <Icon className="size-4" strokeWidth={1.7} />
      {label}
    </Link>
  );
}

export default function AppDashboard() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const { plans, isLoading: plansLoading } = useKovaPlans(user?.id);
  const { profile } = useKovaProfile(user?.id);
  const { sets, isLoading: setsLoading } = useCompletedSets(user?.id);
  const activePlan =
    plans.find((plan) => plan.status === "active") ??
    plans.find((plan) => plan.status === "draft") ??
    plans[0];
  const { days } = useKovaPlanDays(activePlan?.id, user?.id);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const todaysWorkout = days.find((day) => day.day_of_week === todayIndex);
  const nextWorkout = useMemo(() => {
    if (!days.length) return undefined;
    return days.find((day) => day.day_of_week > todayIndex) ?? days[0];
  }, [days, todayIndex]);
  const isLoading = plansLoading || setsLoading;

  const firstName = (
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "there"
  ).split(" ")[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Real consistency data: sets logged per day over the last 7 days.
  const weeklySets = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return { date, count: 0 };
    });
    for (const set of sets) {
      const completed = new Date(set.completed_at);
      const bucket = buckets.find(
        (entry) => entry.date.toDateString() === completed.toDateString(),
      );
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [sets, today]);
  const weekActive = weeklySets.filter((bucket) => bucket.count > 0).length;
  const maxDaySets = Math.max(1, ...weeklySets.map((bucket) => bucket.count));

  const { friends, isLoading: friendsLoading } = useFriends(user?.id);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const gymInfo = useMemo(
    () =>
      profile?.gym_opening_hours
        ? gymStatus(profile.gym_opening_hours, now)
        : { state: "unknown" as const, statusLabel: "Hours unknown", hoursToday: null, nextChange: null },
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
      <div className="mx-auto max-w-6xl">
        {/* Hero / greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="t-label">Today · {formatDate(today)}</p>
          <h1 className="t-display mt-4 max-w-3xl">
            {greeting}, {firstName}.
          </h1>
          <p className="t-body mt-4 max-w-lg">
            {todaysWorkout
              ? "Your session is ready when you are."
              : activePlan
                ? "Your plan is set. Choose a day and keep building the week."
                : "One clear next step is all it takes to start."}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="mt-12 space-y-4">
            <div className="skeleton h-56 w-full rounded-[1.5rem]" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="skeleton h-36 rounded-[1.5rem]" />
              <div className="skeleton h-36 rounded-[1.5rem]" />
              <div className="skeleton h-36 rounded-[1.5rem]" />
            </div>
          </div>
        ) : !activePlan ? (
          <GlassCard className="mt-10 p-8 sm:p-12">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-black">
              <Plus className="size-5" />
            </div>
            <h2 className="t-h1 mt-7">Create your first plan.</h2>
            <p className="t-body mt-4 max-w-md">
              Tell KOVA how you train and what you're aiming for. It builds the week from there —
              and you can skip anything you don't know yet.
            </p>
            <GlassButton variant="primary" size="lg" className="mt-8" onClick={() => navigate("/dashboard/plan?create=1")}>
              Start plan maker
              <ArrowRight className="size-4" />
            </GlassButton>
          </GlassCard>
        ) : (
          <>
            {/* Today's workout — the focal point */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard className="mt-10 overflow-hidden p-6 sm:p-9">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                  <div className="min-w-0 flex-1">
                    <SectionHeader icon={Dumbbell} label={todaysWorkout ? "Today's session" : "Today"} />
                    <h2 className="t-h1 mt-5">{todaysWorkout?.title ?? "No session scheduled"}</h2>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {todaysWorkout?.duration_minutes ? (
                        <span className="t-caption inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" />
                          {todaysWorkout.duration_minutes} min
                        </span>
                      ) : null}
                      <span className="t-caption inline-flex items-center gap-1.5">
                        <Flame className="size-3.5" />
                        {weeklySets[6]?.count ?? 0} sets logged today
                      </span>
                      <span className="t-caption inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {activePlan.name}
                      </span>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <GlassButton variant="solid" size="lg" onClick={() => navigate(`/dashboard/plan/${activePlan.id}`)}>
                        {todaysWorkout ? "Start workout" : "Open plan"}
                        <ArrowRight className="size-4" />
                      </GlassButton>
                      <GlassButton variant="ghost" size="lg" onClick={() => navigate("/dashboard/progress")}>
                        View progress
                      </GlassButton>
                    </div>
                  </div>
                  {/* The week, as a quiet sparkline of real logged sets */}
                  <div className="shrink-0">
                    <SectionHeader label="This week" />
                    <div className="mt-4 flex items-end gap-2">
                      {weeklySets.map((bucket, index) => {
                        const isToday = bucket.date.toDateString() === today.toDateString();
                        const dayLabel = ["S", "M", "T", "W", "T", "F", "S"][bucket.date.getDay()];
                        return (
                          <div key={index} className="flex w-7 flex-col items-center gap-2">
                            <div className="flex h-24 w-full items-end">
                              <motion.div
                                initial={{ height: 4 }}
                                animate={{ height: `${Math.max(6, (bucket.count / maxDaySets) * 100)}%` }}
                                transition={{ delay: 0.3 + index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className={`w-full rounded-lg ${isToday ? "bg-white/85" : bucket.count ? "bg-white/45" : "bg-white/[0.08]"}`}
                              />
                            </div>
                            <span className={`text-[10px] ${isToday ? "text-white/80" : "text-white/30"}`}>
                              {dayLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="t-caption mt-3">
                      {weekActive
                        ? `${weekActive} active day${weekActive === 1 ? "" : "s"} this week`
                        : "No sessions logged this week yet"}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="mt-4 flex flex-wrap gap-2.5"
            >
              <QuickAction to={`/dashboard/plan/${activePlan.id}`} icon={Dumbbell} label="Start workout" />
              <QuickAction to="/dashboard/plan?create=1" icon={Plus} label="Create plan" />
              <QuickAction to="/dashboard/food" icon={Utensils} label="Log food" />
              <QuickAction to="/dashboard/progress" icon={Flame} label="View progress" />
            </motion.div>

            {/* Secondary grid */}
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.45 }}
              >
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={CalendarDays} label="Next session" />
                  <p className="t-h2 mt-6 truncate">{nextWorkout?.title ?? "Nothing planned"}</p>
                  <p className="t-caption mt-2">
                    {nextWorkout
                      ? `${nextWorkout.duration_minutes ? `${nextWorkout.duration_minutes} min · ` : ""}${
                          ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][nextWorkout.day_of_week]
                        }`
                      : "Add a day to your plan"}
                  </p>
                  <Link
                    to={`/dashboard/plan/${activePlan.id}`}
                    className="t-caption mt-5 inline-flex items-center gap-1 text-white/55 hover:text-white"
                  >
                    Open plan <ChevronRight className="size-3" />
                  </Link>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
              >
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={Flame} label="Consistency" />
                  <p className="t-metric mt-6 text-5xl">{sets.length}</p>
                  <p className="t-caption mt-2">
                    {sets.length === 1 ? "set logged in total" : "sets logged in total"}
                  </p>
                  <GlassProgress className="mt-5" value={Math.min(100, (weekActive / 3) * 100)} />
                  <p className="t-caption mt-2.5">
                    {weekActive >= 3 ? "Strong week — keep the rhythm." : "3 active days builds momentum."}
                  </p>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.45 }}
              >
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={Users} label="Friends" />
                  {friendsLoading ? (
                    <div className="mt-6 space-y-3">
                      <div className="skeleton h-9 w-full" />
                      <div className="skeleton h-9 w-4/5" />
                    </div>
                  ) : friends.length ? (
                    <div className="mt-4 space-y-1">
                      {friends.slice(0, 3).map((friend) => (
                        <Link
                          key={friend.id}
                          to={`/u/${encodeURIComponent(friend.username || friend.id)}`}
                          className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
                        >
                          {friend.avatar_url ? (
                            <img
                              src={friend.avatar_url}
                              alt=""
                              className="size-8 shrink-0 rounded-full border border-white/15 object-cover"
                            />
                          ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
                              {initials(friend.display_name || friend.username || "K")}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                            {friend.display_name || friend.username || "Athlete"}
                          </span>
                          <ChevronRight className="size-3.5 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="t-caption mt-6 leading-6">
                      No friends yet. Follow public athletes on the Social page and they'll appear here.
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            </div>

            {/* Gym */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45 }}
            >
              <GlassCard className="mt-4 p-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <SectionHeader icon={MapPin} label="Your gym" />
                    {profile?.gym_name && profile.gym_lat != null && profile.gym_lng != null ? (
                      <>
                        <p className="t-h2 mt-4 truncate">{profile.gym_name}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="glass-chip h-7 px-3 text-[11px]">
                            <span
                              className={`size-1.5 rounded-full ${
                                gymInfo.state === "open" ? "bg-emerald-300" : gymInfo.state === "closed" ? "bg-rose-300" : "bg-white/40"
                              }`}
                            />
                            {gymInfo.statusLabel}
                          </span>
                          {gymInfo.nextChange ? <span className="t-caption">{gymInfo.nextChange}</span> : null}
                          {gymDistanceKm !== null ? <span className="t-caption">· {formatDistance(gymDistanceKm)} away</span> : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="t-h2 mt-4">No gym selected</p>
                        <p className="t-caption mt-2 max-w-md leading-6">
                          Pick your gym on the live map so KOVA knows where you train and when it's open.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    {profile?.gym_name && profile.gym_lat != null && profile.gym_lng != null ? (
                      <>
                        <GymMiniMap
                          gym={{ name: profile.gym_name, lat: profile.gym_lat, lng: profile.gym_lng }}
                          className="h-32 w-full rounded-2xl border border-white/10 lg:w-72"
                        />
                        <div className="flex gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${profile.gym_lat},${profile.gym_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-chip h-9 flex-1 justify-center px-4 text-xs"
                          >
                            <Navigation className="size-3.5" />
                            Directions
                          </a>
                          <Link to="/dashboard/settings" className="glass-chip h-9 justify-center px-4 text-xs">
                            Change
                          </Link>
                        </div>
                      </>
                    ) : (
                      <GlassButton variant="primary" onClick={() => navigate("/dashboard/settings")}>
                        Set your gym
                        <ArrowRight className="size-4" />
                      </GlassButton>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
