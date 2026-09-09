import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const ensureProfile = useCallback(async (user: User | null) => {
    if (!supabase || !user) return;

    // The database trigger is the primary path. This idempotent insert is a
    // safety net for projects where the schema was applied after a user was
    // already created, and it never overwrites an existing profile.
    const displayName =
      user.user_metadata?.display_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      null;
    const result = await supabase.from("profiles").upsert(
      { id: user.id, display_name: displayName },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (result.error) console.warn("KOVA profile bootstrap failed:", result.error.message);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setIsLoading(false);
        void ensureProfile(data.session?.user ?? null);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      void ensureProfile(nextSession?.user ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    return result.data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (result.error) throw result.error;
    return result.data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (result.error) throw result.error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const result = await supabase.auth.signOut();
    if (result.error) throw result.error;
  }, []);

  return {
    user: session?.user ?? null,
    session,
    isLoading,
    isAuthenticated: Boolean(session?.user),
    isConfigured: isSupabaseConfigured,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}

export type SupabaseUser = User;
