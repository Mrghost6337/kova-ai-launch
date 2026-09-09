import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type WorkoutSession = Database["public"]["Tables"]["workout_sessions"]["Row"];
export type PlanDay = Database["public"]["Tables"]["plan_days"]["Row"];
export type PlanExercise = Database["public"]["Tables"]["plan_exercises"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PlanShare = Database["public"]["Tables"]["plan_shares"]["Row"];

const SHORT_WEEK = ["M", "T", "W", "T", "F", "S", "S"];
export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function formatDay(dayOfWeek: number) {
  return WEEK_DAYS[((dayOfWeek % 7) + 7) % 7];
}

export function shortWeek() {
  return SHORT_WEEK;
}

/** Debounced search across public profiles (name or username). */
export function usePublicProfiles(userId: string | undefined, query: string) {
  const [results, setResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!supabase || !userId) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    const client = supabase;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const sanitized = q.replace(/[%_]/g, "").slice(0, 40);
    timer.current = setTimeout(() => {
      void client
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .not("id", "eq", userId)
        .or(`display_name.ilike.%${sanitized}%,username.ilike.%${sanitized}%`)
        .limit(6)
        .then((result) => {
          if (result.error) setError(result.error.message);
          else setResults(result.data ?? []);
          setIsLoading(false);
        });
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, query]);

  return { results, isLoading, error };
}

/** The set of users the signed-in person follows, plus follow/unfollow. */
export function useFollows(userId: string | undefined) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setFollowing(new Set());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase.from("follows").select("following_id").eq("follower_id", userId);
    if (!result.error) setFollowing(new Set((result.data ?? []).map((row) => row.following_id)));
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const currentlyFollowing = following.has(targetId);
      // Optimistic update; rolled back on failure by the caller re-running load.
      setFollowing((current) => {
        const next = new Set(current);
        if (currentlyFollowing) next.delete(targetId);
        else next.add(targetId);
        return next;
      });
      if (currentlyFollowing) {
        const result = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", userId)
          .eq("following_id", targetId);
        if (result.error) {
          await load();
          throw result.error;
        }
      } else {
        const result = await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
        if (result.error) {
          await load();
          throw result.error;
        }
      }
    },
    [following, load, userId],
  );

  return { following, isLoading, reload: load, toggleFollow };
}

/** The users who follow the signed-in person (used to detect mutual friends). */
export function useFollowersOfMe(userId: string | undefined) {
  const [followers, setFollowers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!supabase || !userId) {
      setFollowers(new Set());
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId)
      .then((result) => {
        if (!mounted) return;
        if (!result.error) setFollowers(new Set((result.data ?? []).map((row) => row.follower_id)));
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { followers, isLoading };
}

/** Friends = mutual follows: profiles the signed-in person follows AND that follow back.
 *  Only profiles the viewer is allowed to see (public ones) are returned, most recently followed first. */
export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [followingResult, followersResult] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", userId).order("created_at", { ascending: false }),
      supabase.from("follows").select("follower_id").eq("following_id", userId),
    ]);
    if (followingResult.error || followersResult.error) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    const followersOfMe = new Set((followersResult.data ?? []).map((row) => row.follower_id));
    const ids = (followingResult.data ?? []).map((row) => row.following_id).filter((id) => followersOfMe.has(id));
    if (!ids.length) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    const profileResult = await supabase.from("profiles").select("*").in("id", ids);
    if (profileResult.error) {
      setFriends([]);
      setIsLoading(false);
      return;
    }
    const byId = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
    setFriends(ids.map((id) => byId.get(id)).filter((profile): profile is Profile => Boolean(profile)));
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { friends, isLoading, reload: load };
}

/** Recent public profiles for discovery; searches by name/username when a query is given. */
export function useDiscoverProfiles(userId: string | undefined, query: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!supabase || !userId) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }
    const client = supabase;
    const q = query.trim().replace(/[%_]/g, "").slice(0, 40);
    setIsLoading(true);
    setError(null);
    timer.current = setTimeout(() => {
      const base = client.from("profiles").select("*").eq("is_public", true).not("id", "eq", userId);
      const request = q
        ? base.or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(8)
        : base.order("created_at", { ascending: false }).limit(12);
      void request.then((result) => {
        if (result.error) setError(result.error.message);
        else setProfiles(result.data ?? []);
        setIsLoading(false);
      });
    }, q ? 300 : 0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, query]);

  return { profiles, isLoading, error };
}

/** Recent public posts with their (visible) author profiles. */
export function usePublicPosts(limit = 20) {
  const [posts, setPosts] = useState<Array<Post & { author: Profile }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const result = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return;
    }
    const rows = result.data ?? [];
    const ids = [...new Set(rows.map((row) => row.user_id))];
    if (!ids.length) {
      setPosts([]);
      setIsLoading(false);
      return;
    }
    const profileResult = await supabase.from("profiles").select("*").in("id", ids);
    const byId = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
    setPosts(rows.filter((row) => byId.has(row.user_id)).map((row) => ({ ...row, author: byId.get(row.user_id)! })));
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    let mounted = true;
    void load().then(() => {
      mounted = false;
    });
    return () => {
      mounted = false;
    };
  }, [load]);

  return { posts, isLoading, error, reload: load };
}

/** Recent public workout sessions with their (visible) author profiles. */
export function usePublicSessions(limit = 20) {
  const [sessions, setSessions] = useState<Array<WorkoutSession & { author: Profile }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const result = await supabase
      .from("workout_sessions")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(limit);
    if (result.error) {
      setError(result.error.message);
      setIsLoading(false);
      return;
    }
    const rows = result.data ?? [];
    const ids = [...new Set(rows.map((row) => row.user_id))];
    if (!ids.length) {
      setSessions([]);
      setIsLoading(false);
      return;
    }
    const profileResult = await supabase.from("profiles").select("*").in("id", ids);
    const byId = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
    setSessions(rows.filter((row) => byId.has(row.user_id)).map((row) => ({ ...row, author: byId.get(row.user_id)! })));
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    let mounted = true;
    void load().then(() => {
      mounted = false;
    });
    return () => {
      mounted = false;
    };
  }, [load]);

  return { sessions, isLoading, error, reload: load };
}

/** Posts the signed-in person has liked + like/unlike. */
export function usePostLikes(userId: string | undefined) {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase || !userId) return;
    let mounted = true;
    void supabase.from("post_likes").select("post_id").eq("user_id", userId).then((result) => {
      if (mounted && !result.error) setLiked(new Set((result.data ?? []).map((row) => row.post_id)));
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const currentlyLiked = liked.has(postId);
      setLiked((current) => {
        const next = new Set(current);
        if (currentlyLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      if (currentlyLiked) {
        const result = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        if (result.error) {
          setLiked((current) => new Set([...current, postId]));
          throw result.error;
        }
      } else {
        const result = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
        if (result.error) {
          setLiked((current) => {
            const next = new Set(current);
            next.delete(postId);
            return next;
          });
          throw result.error;
        }
      }
    },
    [liked, userId],
  );

  return { liked, toggleLike };
}

/** Live like count for one post. */
export function usePostLikeCount(postId: string | undefined) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(postId));

  useEffect(() => {
    if (!supabase || !postId) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase.from("post_likes").select("user_id", { count: "exact", head: true }).eq("post_id", postId).then((result) => {
      if (mounted && !result.error) setCount(result.count ?? 0);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [postId]);

  return { count, isLoading };
}

/** Public posts of one user (used on public profiles). */
export function usePublicPostsByUser(userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setPosts([]);
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then((result) => {
        if (!mounted) return;
        if (result.error) setError(result.error.message);
        else setPosts(result.data ?? []);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { posts, isLoading, error };
}

/** Plan shares received by the signed-in user, with plan + sender profile. */
export function usePlanShares(userId: string | undefined) {
  const [shares, setShares] = useState<Array<PlanShare & { plan: Plan | null; sender: Profile | null }>>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setShares([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase
      .from("plan_shares")
      .select("*, plans(*)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (result.error) {
      setError(result.error.message);
      setShares([]);
      setIsLoading(false);
      return;
    }
    const rows = (result.data ?? []) as Array<PlanShare & { plans: Plan | null }>;
    const senderIds = [...new Set(rows.map((row) => row.sender_id))];
    const bySender = new Map<string, Profile>();
    if (senderIds.length) {
      const profileResult = await supabase.from("profiles").select("*").in("id", senderIds);
      if (!profileResult.error) {
        for (const profile of profileResult.data ?? []) bySender.set(profile.id, profile);
      }
    }
    setShares(rows.map((row) => ({ ...row, plan: row.plans, sender: bySender.get(row.sender_id) ?? null })));
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendPlan = useCallback(
    async (recipientId: string, planId: string, note: string) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const result = await supabase.from("plan_shares").insert({ sender_id: userId, recipient_id: recipientId, plan_id: planId, note: note.trim() || null });
      if (result.error) throw result.error;
    },
    [userId],
  );

  const markRead = useCallback(async (shareId: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const result = await supabase.from("plan_shares").update({ read_at: new Date().toISOString() }).eq("id", shareId);
    if (result.error) throw result.error;
    setShares((current) => current.map((share) => (share.id === shareId ? { ...share, read_at: new Date().toISOString() } : share)));
  }, []);

  const dismiss = useCallback(async (shareId: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const result = await supabase.from("plan_shares").delete().eq("id", shareId);
    if (result.error) throw result.error;
    setShares((current) => current.filter((share) => share.id !== shareId));
  }, []);

  return { shares, isLoading, error, reload: load, sendPlan, markRead, dismiss };
}

/** Count of followers / followings for one profile. */
export function useFollowerStats(profileId: string | undefined) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(profileId));

  useEffect(() => {
    if (!supabase || !profileId) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void Promise.all([
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profileId),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", profileId),
    ]).then(([followersResult, followingResult]) => {
      if (!mounted) return;
      setFollowers(followersResult.count ?? 0);
      setFollowing(followingResult.count ?? 0);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [profileId]);

  return { followers, following, isLoading };
}

/** Workout sessions of a user (used on public profiles and own history). */
export function useWorkoutSessions(userId: string | undefined) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(30);
    if (result.error) setError(result.error.message);
    else setSessions(result.data ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const logSession = useCallback(
    async (title: string, completedSets: Array<{ plan_exercise_id: string; set_number: number }>) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const sessionResult = await supabase
        .from("workout_sessions")
        .insert({ user_id: userId, title, completed_at: new Date().toISOString() })
        .select()
        .single();
      if (sessionResult.error) throw sessionResult.error;
      const created = sessionResult.data;
      if (completedSets.length) {
        const setResult = await supabase.from("completed_sets").insert(
          completedSets.map((set) => ({ ...set, user_id: userId, completed_at: new Date().toISOString() })),
        );
        if (setResult.error) throw setResult.error;
      }
      setSessions((current) => [created, ...current]);
      return created;
    },
    [userId],
  );

  return { sessions, isLoading, error, reload: load, logSession };
}

/** Sessions the signed-in person has liked + like/unlike. */
export function useSessionLikes(userId: string | undefined) {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase || !userId) return;
    let mounted = true;
    void supabase.from("session_likes").select("session_id").eq("user_id", userId).then((result) => {
      if (mounted && !result.error) setLiked(new Set((result.data ?? []).map((row) => row.session_id)));
    });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const toggleLike = useCallback(
    async (sessionId: string) => {
      if (!supabase || !userId) throw new Error("You must be signed in.");
      const currentlyLiked = liked.has(sessionId);
      setLiked((current) => {
        const next = new Set(current);
        if (currentlyLiked) next.delete(sessionId);
        else next.add(sessionId);
        return next;
      });
      if (currentlyLiked) {
        const result = await supabase.from("session_likes").delete().eq("session_id", sessionId).eq("user_id", userId);
        if (result.error) {
          setLiked((current) => new Set([...current, sessionId]));
          throw result.error;
        }
      } else {
        const result = await supabase.from("session_likes").insert({ session_id: sessionId, user_id: userId });
        if (result.error) {
          setLiked((current) => {
            const next = new Set(current);
            next.delete(sessionId);
            return next;
          });
          throw result.error;
        }
      }
    },
    [liked, userId],
  );

  return { liked, toggleLike };
}

/** Live like count for one session. */
export function useSessionLikeCount(sessionId: string | undefined) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!supabase || !sessionId) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase.from("session_likes").select("user_id", { count: "exact", head: true }).eq("session_id", sessionId).then(
      (result) => {
        if (mounted && !result.error) setCount(result.count ?? 0);
        setIsLoading(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  return { count, isLoading };
}

/** Public plans of one user (for public profiles). */
export function usePublicPlans(userId: string | undefined) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setPlans([]);
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .then((result) => {
        if (!mounted) return;
        if (result.error) setError(result.error.message);
        else setPlans(result.data ?? []);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { plans, isLoading, error };
}

/** Public profile lookup by username; also matches the signed-in user's own row. */
export function useProfileByUsername(username: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(username));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !username) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    let mounted = true;
    setIsLoading(true);
    void supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle()
      .then((result) => {
        if (!mounted) return;
        if (result.error) setError(result.error.message);
        else setProfile(result.data);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [username]);

  return { profile, isLoading, error };
}

/** Number of workout days in a plan (small count helper). */
export function usePlanDayCount(planId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!supabase || !planId) return;
    let mounted = true;
    void supabase.from("plan_days").select("id", { count: "exact", head: true }).eq("plan_id", planId).then((result) => {
      if (mounted && !result.error) setCount(result.count ?? 0);
    });
    return () => {
      mounted = false;
    };
  }, [planId]);

  return count;
}

/** Read a plan by id. Resolves to null when RLS hides it (private/nonexistent). */
export async function fetchPlanById(planId: string) {
  if (!supabase) return null;
  const result = await supabase.from("plans").select("*").eq("id", planId).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

/** All days for a plan (works for shared/public plans when RLS allows). */
export async function fetchPlanDays(planId: string) {
  if (!supabase) return [];
  const result = await supabase.from("plan_days").select("*").eq("plan_id", planId).order("day_of_week", { ascending: true });
  if (result.error) throw result.error;
  return result.data ?? [];
}

/** All exercises for a day (works for shared/public plans when RLS allows). */
export async function fetchPlanExercises(planDayId: string) {
  if (!supabase) return [];
  const result = await supabase
    .from("plan_exercises")
    .select("*")
    .eq("plan_day_id", planDayId)
    .order("sort_order", { ascending: true });
  if (result.error) throw result.error;
  return result.data ?? [];
}