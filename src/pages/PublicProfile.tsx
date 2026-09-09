import { useState } from "react";
import { ArrowLeft, CalendarDays, Dumbbell, Heart, Lock, Pencil, Send, Trash2, UserPlus, UserCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useFollowerStats,
  useFollowersOfMe,
  useFollows,
  usePlanDayCount,
  usePlanShares,
  usePostLikeCount,
  usePostLikes,
  useProfileByUsername,
  usePublicPlans,
  usePublicPostsByUser,
  useSessionLikeCount,
  useSessionLikes,
  useWorkoutSessions,
  type Post,
  type WorkoutSession,
} from "@/hooks/use-social";
import { useKovaPlans } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function PostCard({ post, viewerId }: { post: Post; viewerId: string | undefined }) {
  const { liked, toggleLike } = usePostLikes(viewerId);
  const { count, isLoading: countLoading } = usePostLikeCount(post.id);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const isLiked = liked.has(post.id);

  const like = async () => {
    setBusy(true);
    try {
      await toggleLike(post.id);
    } catch {
      toast("Could not update like.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!supabase || post.user_id !== viewerId) return;
    setBusy(true);
    try {
      const result = await supabase.from("posts").delete().eq("id", post.id);
      if (result.error) throw result.error;
      setRemoved(true);
    } catch {
      toast("Could not delete post.");
    } finally {
      setBusy(false);
    }
  };

  if (removed) return null;
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">{post.body}</p>
        {post.user_id === viewerId && (
          <button type="button" disabled={busy} onClick={() => void remove()} className="shrink-0 rounded-full p-2 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-kova-rose" aria-label="Delete post">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={busy || !viewerId}
          onClick={() => void like()}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:opacity-50 ${isLiked ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/12 text-white/45 hover:bg-white/[0.06]"}`}
        >
          <Heart className={`size-3.5 ${isLiked ? "fill-kova-rose" : ""}`} />
          {countLoading ? "…" : count}
        </button>
        <span className="text-[11px] text-white/30">{new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function SendPlanDialog({ open, profileId, onClose }: { open: boolean; profileId: string | undefined; onClose: () => void }) {
  const { user } = useSupabaseAuth();
  const { plans, isLoading } = useKovaPlans(user?.id);
  const { sendPlan } = usePlanShares(user?.id);
  const [selectedId, setSelectedId] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!open || !profileId || !selectedId) return;
    setBusy(true);
    try {
      await sendPlan(profileId, selectedId, note);
      toast("Plan sent.");
      setSelectedId("");
      setNote("");
      onClose();
    } catch (error) {
      toast("Could not send plan", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[var(--surface-solid)] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl italic tracking-[-0.04em]">Send a plan</DialogTitle>
          <DialogDescription className="text-sm text-white/45">Pick one of your plans to share. They can open it instantly.</DialogDescription>
        </DialogHeader>
        <div className="mt-1 space-y-3">
          {isLoading ? (
            <p className="text-sm text-white/40">Loading your plans…</p>
          ) : plans.length ? (
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {plans.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => setSelectedId(plan.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${selectedId === plan.id ? "border-white bg-white/[0.08]" : "border-white/10 hover:bg-white/[0.04]"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white/85">{plan.name}</span>
                    <span className="mt-0.5 block text-[11px] text-white/35">{plan.source === "ai" ? "KOVA plan" : "Manual plan"} · {plan.status}</span>
                  </span>
                  <span className={`size-4 shrink-0 rounded-full border ${selectedId === plan.id ? "border-white bg-white" : "border-white/25"}`}>
                    {selectedId === plan.id && <span className="block size-2 translate-x-[3px] translate-y-[3px] rounded-full bg-black" />}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-white/45">You have no plans yet. Create one in the Plan tab first.</p>
          )}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            maxLength={160}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>
        <DialogFooter className="mt-4">
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-full border border-white/15 px-5 text-xs font-medium text-white/60 hover:bg-white/[0.06]">Cancel</button>
          <button type="button" disabled={!selectedId || busy} onClick={() => void send()} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-40">
            <Send className="size-3.5" />Send plan
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const { followers: followersOfMe } = useFollowersOfMe(user?.id);
  const { plans, isLoading: plansLoading, error: plansError } = usePublicPlans(profile?.id);
  const { sessions, isLoading: sessionsLoading } = useWorkoutSessions(profile?.id);
  const { posts, isLoading: postsLoading, error: postsError } = usePublicPostsByUser(profile?.id);
  const [tab, setTab] = useState<"posts" | "plans" | "sessions">("plans");
  const [followBusy, setFollowBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const isOwn = profile ? profile.id === user?.id : false;
  const isFollowing = profile ? following.has(profile.id) : false;
  const isFriend = Boolean(profile && following.has(profile.id) && followersOfMe.has(profile.id));

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
              <div className="flex flex-wrap items-center gap-2">
                {isOwn ? (
                  <Link to="/dashboard/profile" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]"><Pencil className="size-4" />Edit profile</Link>
                ) : (
                  <>
                    <button type="button" onClick={() => setSendOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/[0.06]"><Send className="size-4" />Send plan</button>
                    <button type="button" disabled={followBusy} onClick={() => void follow()} className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-xs font-semibold uppercase tracking-[0.12em] disabled:opacity-50 ${isFriend ? "border-kova-emerald/30 bg-kova-emerald/10 text-kova-emerald hover:bg-kova-emerald/15" : isFollowing ? "border-white/15 text-white/55 hover:bg-white/[0.06]" : "border-white bg-white text-black"}`}>{isFriend ? <UserCheck className="size-4" /> : isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}{isFriend ? "Friends" : isFollowing ? "Following" : "Follow"}</button>
                  </>
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
              <button type="button" onClick={() => setTab("posts")} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === "posts" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Posts</button>
              <button type="button" onClick={() => setTab("plans")} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === "plans" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Plans</button>
              <button type="button" onClick={() => setTab("sessions")} className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === "sessions" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>Sessions</button>
            </div>

            <div className="mt-6">
              {tab === "posts" ? (
                postsLoading ? <p className="text-sm text-white/40">Loading posts…</p> : postsError ? <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">{postsError}</p> : posts.length ? (
                  <div className="space-y-3">{posts.map((post) => <PostCard key={post.id} post={post} viewerId={user?.id} />)}</div>
                ) : (
                  <p className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm leading-6 text-white/40">{isOwn ? "You have not posted anything yet. Share a PR or a thought from the Social feed." : "This athlete has not posted anything yet."}</p>
                )
              ) : tab === "plans" ? (
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
      <SendPlanDialog open={sendOpen} profileId={profile?.id} onClose={() => setSendOpen(false)} />
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