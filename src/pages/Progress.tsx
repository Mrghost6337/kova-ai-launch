import { motion } from "framer-motion";
import { Activity, CalendarDays, Dumbbell, Flame, Utensils } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard, GlassProgress, SectionHeader } from "@/components/glass";
import { Seo } from "@/components/Seo";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useCompletedSets, useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";
import { useFoodEntries, todayKey } from "@/hooks/use-nutrition";
import { useEffect, useState } from "react";

/* ————————————————————————————————————————————————————————————————————————
   Progress — real analytics only. Every number is computed from the
   athlete's own completed sets, logged sessions and food entries. When
   there is no data yet, each card shows an honest empty state instead of
   placeholder numbers.
   ———————————————————————————————————————————————————————————————————————— */

type SessionRow = { id: string; title: string; completed_at: string };

function useRecentSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  useEffect(() => {
    if (!supabase || !userId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void supabase
      .from("workout_sessions")
      .select("id, title, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(12)
      .then((result) => {
        if (!result.error) setSessions(result.data ?? []);
        setIsLoading(false);
      });
  }, [userId]);
  return { sessions, isLoading };
}

/** Sets per week for the last n weeks, oldest first. */
function weeklyVolume(sets: Array<{ completed_at: string; weight: number | null }>, weeks: number) {
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (weeks - 1 - index) * 7 - ((start.getDay() + 6) % 7));
    return { start, count: 0 };
  });
  for (const set of sets) {
    const date = new Date(set.completed_at);
    for (const bucket of buckets) {
      const end = new Date(bucket.start);
      end.setDate(end.getDate() + 7);
      if (date >= bucket.start && date < end) {
        bucket.count += 1;
        break;
      }
    }
  }
  return buckets;
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(1, ...values);
  const width = 100;
  const height = 34;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => `${index * step},${height - (value / max) * (height - 4) - 2}`);
  const path = points.join(" L ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden>
      <path
        d={`M ${path} L ${width},${height} L 0,${height} Z`}
        fill="var(--accent-sky-fade, rgba(56,189,248,0.09))"
        stroke="none"
      />
      <path d={`M ${path}`} fill="none" stroke="var(--accent-sky)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Progress() {
  const { user } = useSupabaseAuth();
  const { profile } = useKovaProfile(user?.id);
  const { plans } = useKovaPlans(user?.id);
  const { sets, isLoading: setsLoading } = useCompletedSets(user?.id);
  const { sessions, isLoading: sessionsLoading } = useRecentSessions(user?.id);
  const { entries } = useFoodEntries(user?.id, todayKey());

  const weeks = useMemo(() => weeklyVolume(sets, 8), [sets]);
  const weeklyCounts = weeks.map((week) => week.count);
  const thisWeek = weeklyCounts[weeklyCounts.length - 1] ?? 0;
  const prevWeek = weeklyCounts[weeklyCounts.length - 2] ?? 0;

  const dayKeys = useMemo(() => {
    const keys: string[] = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      keys.push(
        `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`,
      );
    }
    return keys;
  }, []);
  const last7 = useMemo(
    () => dayKeys.map((key) => sets.filter((set) => String(set.completed_at).slice(0, 10) === key).length),
    [dayKeys, sets],
  );
  const activeDays7 = last7.filter((count) => count > 0).length;

  const heaviest = useMemo(() => {
    const withWeight = sets.filter((set) => set.weight != null && Number(set.weight) > 0);
    if (!withWeight.length) return null;
    return withWeight.reduce((best, set) => (Number(set.weight!) > Number(best.weight!) ? set : best));
  }, [sets]);

  const activePlan = plans.find((plan) => plan.status === "active") ?? plans[0];
  const isLoading = setsLoading || sessionsLoading;

  return (
    <AppShell>
      <Seo title="Progress — KOVA AI" description="Understand your real KOVA AI training progress." path="/dashboard/progress" />
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="t-label">Your history</p>
          <h1 className="t-display mt-4">Progress.</h1>
          <p className="t-body mt-4 max-w-lg">
            Everything here is computed from your own logged training and nutrition. KOVA never
            fills this page with estimates.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <div className="skeleton h-52 rounded-[1.5rem]" />
            <div className="skeleton h-52 rounded-[1.5rem]" />
            <div className="skeleton h-52 rounded-[1.5rem]" />
            <div className="skeleton h-64 rounded-[1.5rem] lg:col-span-2" />
            <div className="skeleton h-64 rounded-[1.5rem]" />
          </div>
        ) : (
          <>
            {/* Top metrics */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={Activity} label="Sets this week" />
                  <p className="t-metric mt-6 text-5xl">{thisWeek}</p>
                  <p className="t-caption mt-2">
                    {thisWeek === 0
                      ? "No sets logged yet this week"
                      : prevWeek
                        ? thisWeek >= prevWeek
                          ? `Up from ${prevWeek} last week`
                          : `Down from ${prevWeek} last week`
                        : "First week of logging"}
                  </p>
                  <GlassProgress className="mt-5" value={Math.min(100, (thisWeek / Math.max(1, prevWeek || 15)) * 100)} />
                </GlassCard>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={CalendarDays} label="Active days · 7d" />
                  <p className="t-metric mt-6 text-5xl">{activeDays7}</p>
                  <p className="t-caption mt-2">of the last 7 days with logged sets</p>
                  <div className="mt-5 flex items-end gap-1.5">
                    {last7.map((count, index) => (
                      <div key={index} className="h-10 flex-1 rounded-md bg-white/[0.07]">
                        <div
                          className="w-full rounded-md bg-white/60 transition-all"
                          style={{ height: `${Math.max(6, (count / Math.max(1, ...last7)) * 100)}%`, marginTop: `${100 - Math.max(6, (count / Math.max(1, ...last7)) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <GlassCard interactive className="h-full p-6">
                  <SectionHeader icon={Dumbbell} label="Heaviest set" />
                  {heaviest ? (
                    <>
                      <p className="t-metric mt-6 text-5xl">{Number(heaviest.weight)}</p>
                      <p className="t-caption mt-2">kg · {formatWhen(String(heaviest.completed_at))}</p>
                    </>
                  ) : (
                    <>
                      <p className="t-metric mt-6 text-5xl text-white/25">—</p>
                      <p className="t-caption mt-2">Log weights with your sets to see this</p>
                    </>
                  )}
                </GlassCard>
              </motion.div>
            </div>

            {/* Volume trend */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="mt-4 p-6 sm:p-8">
                <SectionHeader icon={Flame} label="Weekly volume · last 8 weeks" />
                {sets.length ? (
                  <div className="mt-8">
                    <Sparkline values={weeklyCounts} className="h-24 w-full" />
                    <div className="mt-3 flex justify-between">
                      {weeklyCounts.map((count, index) => (
                        <span key={index} className="t-caption w-8 text-center">
                          {count || ""}
                        </span>
                      ))}
                    </div>
                    <p className="t-caption mt-2">
                      {sets.length} total sets across {new Set(sets.map((set) => String(set.completed_at).slice(0, 10))).size} training days
                    </p>
                  </div>
                ) : (
                  <p className="t-body mt-8 max-w-md">
                    Log your first session from a plan day and your weekly volume will draw itself here.
                  </p>
                )}
              </GlassCard>
            </motion.div>

            {/* Sessions + nutrition */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <GlassCard className="h-full p-6">
                  <SectionHeader icon={CalendarDays} label="Recent sessions" />
                  {sessions.length ? (
                    <ul className="mt-5 space-y-1">
                      {sessions.slice(0, 6).map((session) => (
                        <li key={session.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 hover:bg-white/[0.04]">
                          <span className="min-w-0 truncate text-sm text-white/80">{session.title}</span>
                          <span className="t-caption shrink-0">{formatWhen(session.completed_at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="t-body mt-6">
                      No sessions logged yet. Finish a workout from{" "}
                      {activePlan ? "your plan" : "the Plan page"} and it will appear here.
                    </p>
                  )}
                </GlassCard>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                <GlassCard className="h-full p-6">
                  <SectionHeader icon={Utensils} label="Nutrition today" />
                  {entries.length ? (
                    <>
                      <p className="t-metric mt-6 text-5xl">{entries.reduce((sum, entry) => sum + entry.calories, 0).toLocaleString()}</p>
                      <p className="t-caption mt-2">kcal logged today across {entries.length} entries</p>
                      <div className="mt-6 space-y-3">
                        {(
                          [
                            ["Protein", entries.reduce((sum, entry) => sum + entry.protein_g, 0)],
                            ["Carbs", entries.reduce((sum, entry) => sum + entry.carbs_g, 0)],
                            ["Fat", entries.reduce((sum, entry) => sum + entry.fat_g, 0)],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between text-xs">
                            <span className="text-white/45">{label}</span>
                            <span className="t-num text-white/80">{value}g</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="t-body mt-6">
                      Nothing logged today. Use the Food page to track your meals — macros will surface here.
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            </div>

            {/* Body profile */}
            {profile?.height_cm != null || profile?.weight_kg != null || profile?.age != null ? (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                <GlassCard className="mt-4 p-6">
                  <SectionHeader label="Body profile" />
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    {[
                      ["Height", profile?.height_cm != null ? `${Number(profile.height_cm)} cm` : "—"],
                      ["Weight", profile?.weight_kg != null ? `${Number(profile.weight_kg)} kg` : "—"],
                      ["Age", profile?.age != null ? `${profile.age}` : "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="t-label">{label}</p>
                        <p className="t-metric mt-2 text-2xl">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="t-caption mt-5">Captured during onboarding. Update it any time in Settings.</p>
                </GlassCard>
              </motion.div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
