import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Dumbbell,
  Heart,
  Inbox,
  Link2,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useDiscoverProfiles,
  useFollowersOfMe,
  useFollows,
  usePlanShares,
  usePostLikeCount,
  usePostLikes,
  usePublicPosts,
  usePublicSessions,
  useSessionLikeCount,
  useSessionLikes,
  type Post,
  type Profile,
  type WorkoutSession,
} from "@/hooks/use-social";
import { useKovaPlans, useKovaProfile } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{children}</p>;
}

function Avatar({ profile, className = "size-10" }: { profile: Profile; className?: string }) {
  const name = profile.display_name || profile.username || "K";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return profile.avatar_url ? (
    <img src={profile.avatar_url} alt="" className={`${className} shrink-0 rounded-full border border-white/15 object-cover`} />
  ) : (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white/70`}>{initials}</span>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function profilePath(profile: Profile) {
  return `/u/${encodeURIComponent(profile.username || profile.id)}`;
}

type FollowState = "friend" | "following" | "none";

function FollowButton({
  state,
  busy,
  onToggle,
  className = "",
}: {
  state: FollowState;
  busy: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const styles = {
    friend: "border-kova-emerald/30 bg-kova-emerald/10 text-kova-emerald hover:bg-kova-emerald/15",
    following: "border-white/15 text-white/55 hover:bg-white/[0.06]",
    none: "border-white bg-white text-black",
  } as const;
  const labels = { friend: "Friends", following: "Following", none: "Follow" } as const;
  const icons = { friend: UserCheck, following: UserCheck, none: UserPlus } as const;
  const Icon = icons[state];
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onToggle}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${styles[state]} ${className}`}
    >
      <Icon className="size-3.5" />
      {labels[state]}
    </button>
  );
}

/* ---------------------------------- Send plan ---------------------------------- */

function SendPlanDialog({
  target,
  onClose,
}: {
  target: Profile | null;
  onClose: () => void;
}) {
  const { user } = useSupabaseAuth();
  const { plans, isLoading } = useKovaPlans(user?.id);
  const { sendPlan } = usePlanShares(user?.id);
  const [selectedId, setSelectedId] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!target || !selectedId) return;
    setBusy(true);
    try {
      await sendPlan(target.id, selectedId, note);
      toast("Plan sent", { description: `Shared with @${target.username || "athlete"}.` });
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
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[var(--surface-solid)] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl italic tracking-[-0.04em]">Send a plan</DialogTitle>
          <DialogDescription className="text-sm text-white/45">
            {target ? <>Share one of your plans with <span className="text-white/75">@{target.username || "this athlete"}</span>. They can open it instantly.</> : "Share a plan."}
          </DialogDescription>
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

/* ---------------------------------- Feed cards ---------------------------------- */

function PostCard({
  post,
  liked,
  isOwn,
  onLike,
  onDelete,
}: {
  post: Post & { author: Profile };
  liked: boolean;
  isOwn: boolean;
  onLike: () => void;
  onDelete: () => void;
}) {
  const { count, isLoading: countLoading } = usePostLikeCount(post.id);
  const [busy, setBusy] = useState(false);

  const like = async () => {
    setBusy(true);
    try {
      await onLike();
    } catch {
      toast("Could not update like.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-center gap-3">
        <Link to={profilePath(post.author)}><Avatar profile={post.author} className="size-10" /></Link>
        <div className="min-w-0 flex-1">
          <Link to={profilePath(post.author)} className="block truncate text-sm font-medium text-white/85 hover:text-white">{post.author.display_name || post.author.username || "Athlete"}</Link>
          <p className="truncate text-[11px] text-white/35">@{post.author.username || "—"} · {formatWhen(post.created_at)}</p>
        </div>
        {isOwn && (
          <button type="button" onClick={onDelete} className="rounded-full p-2 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-kova-rose" aria-label="Delete post">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{post.body}</p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void like()}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:opacity-50 ${liked ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/12 text-white/45 hover:bg-white/[0.06]"}`}
        >
          <Heart className={`size-3.5 ${liked ? "fill-kova-rose" : ""}`} />
          {countLoading ? "…" : count}
        </button>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  liked,
  onLike,
}: {
  session: WorkoutSession & { author: Profile };
  liked: boolean;
  onLike: () => void;
}) {
  const { count, isLoading: countLoading } = useSessionLikeCount(session.id);
  const [busy, setBusy] = useState(false);

  const like = async () => {
    setBusy(true);
    try {
      await onLike();
    } catch {
      toast("Could not update like.");
    } finally {
      setBusy(false);
    }
  };

  const date = new Date(session.completed_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <div className="rounded-[1.5rem] border border-kova-sky/[0.12] bg-kova-sky/[0.03] p-5">
      <div className="flex items-center gap-3">
        <Link to={profilePath(session.author)}><Avatar profile={session.author} className="size-10" /></Link>
        <div className="min-w-0 flex-1">
          <Link to={profilePath(session.author)} className="block truncate text-sm font-medium text-white/85 hover:text-white">{session.author.display_name || session.author.username || "Athlete"}</Link>
          <p className="truncate text-[11px] text-white/35">@{session.author.username || "—"} · {formatWhen(session.completed_at)}</p>
        </div>
        <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-kova-sky/10 text-kova-sky sm:flex"><Dumbbell className="size-4" /></span>
      </div>
      <h3 className="mt-4 font-serif text-2xl italic tracking-[-0.03em]">{session.title}</h3>
      <p className="mt-1 text-xs text-white/35">{date}{session.notes ? ` · ${session.notes}` : ""}</p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void like()}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors disabled:opacity-50 ${liked ? "border-kova-rose/30 bg-kova-rose/10 text-kova-rose" : "border-white/12 text-white/45 hover:bg-white/[0.06]"}`}
        >
          <Heart className={`size-3.5 ${liked ? "fill-kova-rose" : ""}`} />
          {countLoading ? "…" : count}
        </button>
        <Link to={profilePath(session.author)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-white/35 transition-colors hover:text-white">View profile</Link>
      </div>
    </div>
  );
}

/* ---------------------------------- Composer ---------------------------------- */

function Composer({ onPosted }: { onPosted: () => void }) {
  const { user } = useSupabaseAuth();
  const { profile } = useKovaProfile(user?.id);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async () => {
    if (!supabase || !user || !body.trim()) return;
    setBusy(true);
    try {
      const result = await supabase.from("posts").insert({ user_id: user.id, body: body.trim() });
      if (result.error) throw result.error;
      setBody("");
      onPosted();
      toast("Posted to your community.");
    } catch (error) {
      toast("Could not post", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const author = profile ?? {
    id: user?.id ?? "",
    username: null,
    display_name: user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Athlete",
    avatar_url: typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    bio: null,
    fitness_goal: null,
    training_level: null,
    is_public: true,
    gym_name: null,
    gym_lat: null,
    gym_lng: null,
    gym_osm_type: null,
    gym_osm_id: null,
    gym_opening_hours: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-start gap-3">
        <Avatar profile={author} className="size-10" />
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share something with your community — a PR, a session, a thought…"
            rows={3}
            maxLength={280}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-[11px] ${body.length > 240 ? "text-kova-rose" : "text-white/30"}`}>{body.length}/280</span>
            <button
              type="button"
              disabled={!body.trim() || busy}
              onClick={() => void post()}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.02] disabled:opacity-40"
            >
              <Sparkles className="size-3.5" />Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

type Tab = "discover" | "feed" | "inbox";

export default function Social() {
  const { user } = useSupabaseAuth();
  const [tab, setTab] = useState<Tab>("discover");
  const [query, setQuery] = useState("");
  const { profiles, isLoading: discoverLoading, error: discoverError } = useDiscoverProfiles(user?.id, query);
  const { following, isLoading: followsLoading, toggleFollow } = useFollows(user?.id);
  const { followers } = useFollowersOfMe(user?.id);
  const { posts, isLoading: postsLoading, error: postsError, reload: reloadPosts } = usePublicPosts(20);
  const { sessions, isLoading: sessionsLoading, error: sessionsError, reload: reloadSessions } = usePublicSessions(20);
  const { shares, isLoading: sharesLoading, error: sharesError, markRead, dismiss } = usePlanShares(user?.id);
  const postLikes = usePostLikes(user?.id);
  const sessionLikes = useSessionLikes(user?.id);
  const [sendTarget, setSendTarget] = useState<Profile | null>(null);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  const follow = async (profile: Profile) => {
    setFollowBusyId(profile.id);
    try {
      await toggleFollow(profile.id);
    } catch (error) {
      toast("Could not update follow", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setFollowBusyId(null);
    }
  };

  const deletePost = async (post: Post) => {
    if (!supabase || post.user_id !== user?.id) return;
    try {
      const result = await supabase.from("posts").delete().eq("id", post.id);
      if (result.error) throw result.error;
      await reloadPosts();
      toast("Post deleted.");
    } catch (error) {
      toast("Could not delete post", { description: error instanceof Error ? error.message : "Try again." });
    }
  };

  const feed = useMemo(() => {
    type FeedItem =
      | { key: string; date: string; kind: "post"; post: Post & { author: Profile } }
      | { key: string; date: string; kind: "session"; session: WorkoutSession & { author: Profile } };
    const items: FeedItem[] = [
      ...posts.map((post) => ({ key: `post-${post.id}`, date: post.created_at, kind: "post" as const, post })),
      ...sessions.map((session) => ({ key: `session-${session.id}`, date: session.completed_at, kind: "session" as const, session })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts, sessions]);

  const isFriend = (profileId: string) => following.has(profileId) && followers.has(profileId);
  const unreadShares = shares.filter((share) => !share.read_at).length;

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "discover", label: "Discover" },
    { key: "feed", label: "Feed" },
    { key: "inbox", label: "Inbox", count: unreadShares },
  ];

  return (
    <AppShell>
      <Seo title="Social — KOVA AI" description="Discover athletes, share workouts and follow the KOVA AI community." path="/dashboard/social" />
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <Label>Community</Label>
          <h1 className="mt-3 font-serif text-[clamp(2.8rem,6vw,4.5rem)] italic leading-[0.9] tracking-[-0.07em]">Social</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">Discover athletes, follow their training and share your own progress.</p>

          <div className="mt-8 flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors ${tab === item.key ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
              >
                {item.label}
                {typeof item.count === "number" && item.count > 0 && (
                  <span className={`flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ${tab === item.key ? "bg-black text-white" : "bg-kova-amber/20 text-kova-amber"}`}>{item.count}</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ------------------------------ Discover ------------------------------ */}
        {tab === "discover" && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search athletes by name or @username…"
                className="h-12 w-full rounded-full border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              />
            </div>

            {discoverLoading || followsLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-sm text-white/40"><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />Finding athletes…</div>
            ) : discoverError ? (
              <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-6 text-sm text-red-200">{discoverError}</p>
            ) : profiles.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-colors hover:bg-white/[0.045]">
                    <Link to={profilePath(profile)}><Avatar profile={profile} className="size-12" /></Link>
                    <div className="min-w-0 flex-1">
                      <Link to={profilePath(profile)} className="block truncate text-sm font-medium text-white/85 hover:text-white">{profile.display_name || profile.username || "Athlete"}</Link>
                      <p className="truncate text-[11px] text-white/35">@{profile.username || "—"}{profile.fitness_goal ? ` · ${profile.fitness_goal}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => setSendTarget(profile)} className="rounded-full p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label={`Send plan to ${profile.display_name || profile.username}`}>
                        <Send className="size-3.5" />
                      </button>
                      {profile.id !== user?.id && (
                        <FollowButton
                          state={isFriend(profile.id) ? "friend" : following.has(profile.id) ? "following" : "none"}
                          busy={followBusyId === profile.id}
                          onToggle={() => void follow(profile)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <Users className="mx-auto size-6 text-white/25" />
                <p className="mt-4 text-sm text-white/50">{query ? `No public athletes match “${query}”.` : "No public athletes yet. Make your profile public in Settings so others can find you."}</p>
                <Link to="/dashboard/settings" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:text-white/65">Open settings <ArrowRight className="size-4" /></Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ------------------------------ Feed ------------------------------ */}
        {tab === "feed" && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 space-y-4">
            <Composer onPosted={() => void reloadPosts()} />
            {postsLoading || sessionsLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-sm text-white/40"><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />Loading the feed…</div>
            ) : postsError || sessionsError ? (
              <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-6 text-sm text-red-200">{postsError || sessionsError}</p>
            ) : feed.length ? (
              <div className="space-y-3">
                {feed.map((item) => {
                  if (item.kind === "post") {
                    return (
                      <PostCard
                        key={item.key}
                        post={item.post}
                        liked={postLikes.liked.has(item.post.id)}
                        isOwn={item.post.user_id === user?.id}
                        onLike={() => postLikes.toggleLike(item.post.id)}
                        onDelete={() => void deletePost(item.post)}
                      />
                    );
                  }
                  return (
                    <SessionCard key={item.key} session={item.session} liked={sessionLikes.liked.has(item.session.id)} onLike={() => sessionLikes.toggleLike(item.session.id)} />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <Inbox className="mx-auto size-6 text-white/25" />
                <p className="mt-4 text-sm text-white/50">No activity yet. Log a workout in your plan or post something — the community feed starts with you.</p>
                <Link to="/dashboard/plan" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:text-white/65">Open your plan <ArrowRight className="size-4" /></Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ------------------------------ Inbox ------------------------------ */}
        {tab === "inbox" && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 space-y-3">
            {sharesLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-sm text-white/40"><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />Loading shares…</div>
            ) : sharesError ? (
              <p className="rounded-2xl border border-red-300/20 bg-red-300/5 p-6 text-sm text-red-200">{sharesError}</p>
            ) : shares.length ? (
              shares.map((share) => (
                <div key={share.id} className={`rounded-2xl border p-5 transition-colors ${share.read_at ? "border-white/[0.08] bg-white/[0.02]" : "border-kova-amber/25 bg-kova-amber/[0.04]"}`}>
                  <div className="flex items-center gap-3">
                    {share.sender ? (
                      <Link to={profilePath(share.sender)}><Avatar profile={share.sender} className="size-11" /></Link>
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-full bg-white/[0.08] text-white/40"><Users className="size-4" /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/85">
                        <Link to={share.sender ? profilePath(share.sender) : "#"} className="font-medium hover:text-white">{share.sender?.display_name || share.sender?.username || "An athlete"}</Link>{" "}
                        <span className="text-white/40">shared a plan with you</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/35">{formatWhen(share.created_at)}{share.note ? ` · “${share.note}”` : ""}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/dashboard/plan/${share.plan_id}`}
                      onClick={() => { if (!share.read_at) void markRead(share.id); }}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.1em] text-black"
                    >
                      <Link2 className="size-3.5" />{share.plan ? `Open ${share.plan.name}` : "Open plan"}
                    </Link>
                    <button type="button" onClick={() => void dismiss(share.id)} className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-xs font-medium text-white/50 hover:bg-white/[0.06]">Dismiss</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <Inbox className="mx-auto size-6 text-white/25" />
                <p className="mt-4 text-sm text-white/50">No shared plans yet. Plans sent to you appear here — and you can send yours from any profile with the send icon.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <SendPlanDialog target={sendTarget} onClose={() => setSendTarget(null)} />
    </AppShell>
  );
}