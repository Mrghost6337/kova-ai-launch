import { useState } from "react";
import { ArrowLeft, CalendarDays, Dumbbell, Heart, Lock, Pencil, UserPlus, UserCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import {
  useFollowerStats,
  useFollows,
  usePlanDayCount,
  useProfileByUsername,
  usePublicPlans,
  useSessionLikeCount,
  useSessionLikes,
  useWorkoutSessions,
  type WorkoutSession,
} from "@/hooks/use-social";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { toast } from "sonner";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function SessionCard({ session, viewerId }: { session: WorkoutSession; viewerId: string | undefined }) {
  const { liked, toggleLike } = useSessionLikes(viewerId);
  const { count, isLoading: countLoading } = useSessionLikeCount(session.id);
  const [busy, setBusy] = useState(false);
  const isLiked = liked.has(session.id);

  const like = async () => {
    setBusy(true);
    try {
      await toggleLike(session.id);
    } catch {
      toast("Could not update like.");
    } finally {
      setBusy(false);
    }
  };

  const date = new Date(session.completed_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kova-sky/10 text-kova-sky"><Dumbbell className="size-4" /></span>
        <div className="min-w-0">
          <p className="truncate text-sm text-white/80">{session.title}</p>
          <p className="mt-1 text-xs text-white/35">{date}{session.notes ? ` · ${session.notes}` : ""}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy || !viewerId}
        onClick={() => void like()}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors disabled:opacity-50 ${isLiked ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/15 text-white/50 hover:bg-white/[0.06]"}`}
      >
        <Heart className={`size-3.5 ${isLiked ? "fill-kova-rose" : ""}`} />
        {countLoading ? "…" : count}
      </button>
    </div>
  );
}

export default function PublicProfile() {
  const { username = "" } = useParams();
  const { user } = useSupabaseAuth();
  const { profile, isLoading, error } = useProfileByUsername(username);
  const { followers, following: followingCount } = useFollowerStats(profile?.id);
  const { following, toggleFollow } = useFollows(user?.id);
  const { plans, isLoading: plansLoading, error: plansError } = usePublicPlans(profile?.id);
  const { sessions, isLoading: sessionsLoading } = useWorkoutSessions(profile?.id);
  const [tab, setTab] = useState<"plans" | "sessions">("plans");
  const [followBusy, setFollowBusy] = useState(false);

  const isOwn = profile ? profile.id === user?.id : false;
  const isFollowing = profile ? following.has(profile.id) : false;

  const follow = async () => {
    if (!profile) return;
    setFollowBusy(true);
    try {
      await toggleFollow(profile.id);
    } catch {
      toast("Could not update follow.");
    } finally {
      setFollowBusy(false);
    }
  };

  const displayName = profile?.display_name || profile?.username || "Athlete";
  const isVisible = profile && (profile.is_public || isOwn);

  return (
    <AppShell>
      <Seo title={`${displayName} — KOVA AI`} description={profile?.bio ?? "KOVA AI public profile."} path={`/u/${username}`} />
      <div className="mx-auto max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />Dashboard</Link>

        {isLoading ? <p className="mt-12 text-sm text-white/40">Loading profile…</p> : error ? <p className="mt-12 text-sm text-red-200">{error}</p> : !profile ? (
          <div className="mt-12 rounded-2xl border border-white/10 p-8 text-white/55">No public profile found for “{username}”.</div>
        ) : !isVisible ? (
          <div className="mt-12 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
            <Lock className="mx-auto size-6 text-white/40" />
            <h1 className="mt-6 font-serif text-4xl italic tracking-[-0.05em]">This profile is private.</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/45">“{username}” has not made their profile public. Their plans and sessions stay private.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mt-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="flex items-center gap-5">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="size-20 rounded-full border border-white/15 object-cover" />
                ) : (
                  <span className="flex size-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-black">{initials(displayName)}</span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate font-serif text-5xl italic tracking-[-0.06em]">{displayName}</h1>
                  <p className="mt-2 text-sm text-white/40">@{profile.username ?? "—"}{profile.training_level ? ` · ${profile.training_level}` : ""}</p>
                  {profile.fitness_goal && <span className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/50">{profile.fitness_goal}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwn ? (
                  <Link to="/dashboard/profile" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]"><Pencil className="size-4" />Edit profile</Link>
                ) : (
                  <button type="button" disabled={followBusy} onClick={() => void follow()} className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-50 ${isFollowing ? "border-white/15 text-white/55 hover:bg-white/[0.06]" : "border-white bg-white text-black"}`}>{isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}{isFollowing ? "Following" : "Follow"}</button>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-white/45">
              <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{followers} follower{followers === 1 ? "" : "s"}</span>
              <span className="text-white/20">·</span>
              <span>{followingCount} following</span>
            </div>

            {profile.bio && <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60">{profile.bio}</p>}

            {/* Tabs */}
            <div className="mt-10 flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 w-fit">
              <button type="button" onClick={() => setTab("plans")} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === "plans" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Plans</button>
              <button type="button" onClick={() => setTab("sessions")} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === "sessions" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Sessions</button>
            </div>

            <div className="mt-6">
              {tab === "plans" ? (
                plansLoading ? <p className="text-sm text-white/40">Loading plans…</p> : plansError ? <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">{plansError}</p> : plans.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {plans.map((plan) => <PlanCard key={plan.id} planId={plan.id} name={plan.name} source={plan.source} status={plan.status} />)}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm leading-6 text-white/40">{isOwn ? "You have not shared any plans yet. Open a plan and press Share to publish it." : "This athlete has not shared any plans yet."}</p>
                )
              ) : (
                sessionsLoading ? <p className="text-sm text-white/40">Loading sessions…</p> : sessions.length ? (
                  <div className="space-y-2">{sessions.map((session) => <SessionCard key={session.id} session={session} viewerId={user?.id} />)}</div>
                ) : (
                  <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm leading-6 text-white/40">{isOwn ? "You have not logged any sessions yet. Finish a workout in your plan and press “Log this workout”." : "This athlete has not logged any public sessions yet."}</p>
                )
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function PlanCard({ planId, name, source, status }: { planId: string; name: string; source: "ai" | "manual"; status: string }) {
  const dayCount = usePlanDayCount(planId);
  return (
    <Link to={`/dashboard/plan/${planId}`} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition-colors hover:bg-white/[0.06]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{source === "ai" ? "KOVA plan" : "Manual plan"} · {status}</p>
      <h2 className="mt-6 font-serif text-2xl italic tracking-[-0.04em]">{name}</h2>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/40"><CalendarDays className="size-3.5" />{dayCount} workout day{dayCount === 1 ? "" : "s"} · View plan</p>
    </Link>
  );
}