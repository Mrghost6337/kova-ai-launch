import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useTheme } from "@/hooks/use-theme";
import { ArrowRight, Check, Loader2, Mail, LockKeyhole, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { KovaLogo } from "@/components/KovaLogo";
import { Seo } from "@/components/Seo";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function AuthPage({ redirectAfterAuth = "/dashboard" }: { redirectAfterAuth?: string }) {
  const { isConfigured, isLoading: sessionLoading, isAuthenticated, signIn, signUp, signInWithGoogle } = useSupabaseAuth();
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("returnTo") ?? redirectAfterAuth);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && isAuthenticated) navigate(redirect, { replace: true });
  }, [isAuthenticated, navigate, redirect, sessionLoading]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      if (mode === "sign-up") {
        const result = await signUp(email, password, name);
        if (!result.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("sign-in");
        } else navigate(redirect);
      } else {
        await signIn(email, password);
        navigate(redirect);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true); setError(null);
    try { await signInWithGoogle(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Google sign-in is unavailable."); setBusy(false); }
  };

  return (
    <main className={`relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--app-bg)] px-5 py-12 text-white ${resolved === "light" ? "light" : ""}`}>
      <Seo title="Open KOVA AI" description="Sign in to your personal KOVA AI training workspace." path="/auth" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-[min(90vw,680px)] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[120px]" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mx-auto mb-8 flex w-fit items-center gap-3 text-white/70 transition-colors hover:text-white">
          <KovaLogo className="size-9 rounded-[23%] ring-1 ring-white/15" /><span className="text-sm font-semibold uppercase tracking-[0.25em]">KOVA <span className="font-light text-white/45">AI</span></span>
        </Link>
        <section className="liquid-glass rounded-[2rem] border-white/[0.15] bg-white/[0.055] p-6 sm:p-8">
          <div className="mb-8"><p className="eyebrow">Your training workspace</p><h1 className="mt-4 font-serif text-5xl italic tracking-[-0.06em]">{mode === "sign-in" ? "Welcome back." : "Start with KOVA."}</h1><p className="mt-3 text-sm leading-6 text-white/45">{mode === "sign-in" ? "Pick up where your training left off." : "A clear place to plan, train and progress."}</p></div>
          {!isConfigured ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-white/60"><p className="font-medium text-white">Supabase is not configured yet.</p><p className="mt-2">Add <code className="text-white">VITE_SUPABASE_URL</code> and <code className="text-white">VITE_SUPABASE_ANON_KEY</code> in Vercel or <code className="text-white">.env.local</code>, then reload.</p></div>
          ) : <>
            <button type="button" onClick={google} disabled={busy} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.06] text-sm font-medium text-white transition-colors hover:bg-white/[0.1] disabled:opacity-50"><span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">G</span> Continue with Google</button>
            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-white/25"><span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" /></div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "sign-up" && <label className="relative block"><UserRound className="absolute left-4 top-3.5 size-4 text-white/35" /><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35" /></label>}
              <label className="relative block"><Mail className="absolute left-4 top-3.5 size-4 text-white/35" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email address" className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35" /></label>
              <label className="relative block"><LockKeyhole className="absolute left-4 top-3.5 size-4 text-white/35" /><input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/35" /></label>
              {error && <p className="text-sm leading-6 text-red-300">{error}</p>}{message && <p className="flex gap-2 text-sm leading-6 text-white/65"><Check className="mt-1 size-4 shrink-0" />{message}</p>}
              <button type="submit" disabled={busy} className="group flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <>{mode === "sign-in" ? "Sign in" : "Create account"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></>}</button>
            </form>
            <p className="mt-7 text-center text-sm text-white/40">{mode === "sign-in" ? "New to KOVA?" : "Already have an account?"}{" "}<button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(null); setMessage(null); }} className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">{mode === "sign-in" ? "Create an account" : "Sign in"}</button></p>
          </>}
        </section>
        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-white/25">Your data stays yours · KOVA handles the complexity</p>
      </div>
    </main>
  );
}
