import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, Dumbbell, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useKovaPlans } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const questions = [
  { key: "experience", title: "Where are you starting?", explanation: "This helps KOVA choose a sensible starting point. You do not need to know training science.", options: ["Complete beginner", "Some experience", "Intermediate", "Advanced", "I don't know"] },
  { key: "location", title: "Where do you train?", explanation: "Your training space tells KOVA which movements can realistically fit your plan.", options: ["Gym", "Home", "Home + Gym", "No equipment / bodyweight"] },
  { key: "availability", title: "How often can you train?", explanation: "A plan should fit your real week, not an ideal week.", options: ["2 days", "3 days", "4 days", "5 days", "6+ days", "I don't know"] },
  { key: "goal", title: "What do you want to work toward?", explanation: "KOVA uses your main goal to shape the direction of your plan.", options: ["Build muscle", "Lose fat", "Get stronger", "General fitness", "Improve endurance", "I don't know"] },
  { key: "timeline", title: "What would you like to achieve over the next few months?", explanation: "A few words help make your plan feel personal. You can skip this.", options: [] },
  { key: "preferences", title: "Any exercises or movements to know about?", explanation: "Tell KOVA what you enjoy, dislike or cannot currently do. This is optional.", options: [] },
] as const;

type Mode = "ai" | "manual";

export default function Plan() {
  const { user } = useSupabaseAuth();
  const { plans, isLoading, error, createPlan } = useKovaPlans(user?.id);
  const [params] = useSearchParams();
  const [creating, setCreating] = useState(params.get("create") === "1");
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();
  const question = questions[step];

  const setAnswer = (value: string) => {
    if (question) setAnswers((current) => ({ ...current, [question.key]: value }));
  };

  const savePlan = async (nextAnswers = answers) => {
    setSaving(true);
    setSaveError(null);
    try {
      const plan = await createPlan({
        name: nextAnswers.name || (nextAnswers.goal ? `${nextAnswers.goal} plan` : "My first KOVA plan"),
        source: mode ?? "ai",
        status: "draft",
        onboarding_answers: nextAnswers,
      });
      navigate(`/dashboard/plan/${plan.id}`);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Could not save your plan.");
    } finally {
      setSaving(false);
    }
  };

  if (creating) {
    return (
      <AppShell>
        <Seo title="Create a plan — KOVA AI" description="Create a personal KOVA AI training plan." path="/dashboard/plan" />
        <div className="mx-auto max-w-2xl">
          <button type="button" onClick={() => { if (!mode) setCreating(false); else if (mode === "ai" && step > 0) setStep((value) => value - 1); else setMode(null); }} className="mb-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/40 hover:text-white"><ArrowLeft className="size-4" />Back</button>
          {!mode ? (
            <>
              <p className="eyebrow">Plan maker</p>
              <h1 className="mt-4 font-serif text-5xl italic tracking-[-0.07em] sm:text-6xl">How should we start?</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">Choose a starting point. Both options stay editable, and nothing is generated until you confirm.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => setMode("ai")} className="liquid-glass rounded-[1.5rem] border-white/15 bg-white/[0.06] p-6 text-left transition-transform hover:-translate-y-1"><Sparkles className="size-5 text-white/70" /><h2 className="mt-8 font-serif text-3xl italic">Create with AI</h2><p className="mt-3 text-sm leading-6 text-white/45">Answer a few simple questions progressively. Skip anything you do not know.</p><span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">Start <ArrowRight className="size-4" /></span></button>
                <button type="button" onClick={() => setMode("manual")} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 text-left transition-colors hover:bg-white/[0.05]"><Dumbbell className="size-5 text-white/55" /><h2 className="mt-8 font-serif text-3xl italic">Create manually</h2><p className="mt-3 text-sm leading-6 text-white/45">Save a plan shell now and add your days and exercises yourself.</p><span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">Start <ArrowRight className="size-4" /></span></button>
              </div>
            </>
          ) : mode === "manual" ? (
            <>
              <p className="eyebrow">Manual plan</p>
              <h1 className="mt-5 font-serif text-5xl italic tracking-[-0.07em]">Name your plan.</h1>
              <input value={answers.name ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. My strength plan" className="mt-8 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white outline-none placeholder:text-white/25 focus:border-white/30" />
              {saveError && <p className="mt-4 text-sm text-red-200">{saveError}</p>}
              <button type="button" disabled={saving} onClick={() => void savePlan()} className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-sm font-semibold text-black disabled:opacity-50">{saving ? "Saving…" : "Save plan"}<Check className="size-4" /></button>
            </>
          ) : question ? (
            <>
              <div className="flex items-center justify-between"><p className="eyebrow">KOVA onboarding</p><span className="text-xs text-white/30">{step + 1} / {questions.length}</span></div>
              <div className="mt-7 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
              <h1 className="mt-10 font-serif text-5xl italic leading-[0.95] tracking-[-0.07em]">{question.title}</h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">{question.explanation}</p>
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-xs text-white/40 hover:text-white"><CircleHelp className="size-4" />Explain this</button>
              {question.options.length > 0 ? <div className="mt-8 grid gap-2">{question.options.map((option) => <button type="button" key={option} onClick={() => setAnswer(option)} className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm transition-colors ${answers[question.key] === option ? "border-white/55 bg-white text-black" : "border-white/10 bg-white/[0.025] text-white/65 hover:bg-white/[0.06]"}`}>{option}{answers[question.key] === option && <Check className="size-4" />}</button>)}</div> : <textarea value={answers[question.key] ?? ""} onChange={(event) => setAnswer(event.target.value)} placeholder="You can leave this blank" className="mt-8 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />}
              {saveError && <p className="mt-4 text-sm text-red-200">{saveError}</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => { const next = { ...answers, [question.key]: "unknown" }; setAnswers(next); if (step === questions.length - 1) void savePlan(next); else setStep((value) => value + 1); }} className="h-11 rounded-full border border-white/10 px-5 text-xs font-medium uppercase tracking-[0.12em] text-white/50 hover:text-white">{step === questions.length - 1 ? "Skip & save" : "Skip"}</button><button type="button" disabled={saving} onClick={() => { if (step === questions.length - 1) void savePlan(); else setStep((value) => value + 1); }} className="group flex h-11 flex-1 items-center justify-center gap-3 rounded-full bg-white text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">{step === questions.length - 1 ? (saving ? "Saving…" : "Save draft plan") : "Continue"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></button></div>
            </>
          ) : null}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Seo title="Plan — KOVA AI" description="Build and manage your KOVA AI training plan." path="/dashboard/plan" />
      <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Your training</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Plan.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/45">A clear place for your workouts, recovery and progression.</p></div><button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black"><Plus className="size-4" />Create plan</button></div>{error && <p className="mt-8 rounded-2xl border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-200">Could not load your plans: {error}</p>}{isLoading ? <p className="mt-12 text-sm text-white/40">Loading your plans…</p> : plans.length === 0 ? <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 sm:p-12"><CalendarDays className="size-6 text-white/45" /><h2 className="mt-8 font-serif text-4xl italic tracking-[-0.06em]">No plan yet.</h2><p className="mt-3 max-w-md text-sm leading-7 text-white/45">Start with a guided setup or create a blank plan. KOVA never fills your history with made-up workouts.</p><button type="button" onClick={() => setCreating(true)} className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">Open plan maker <ArrowRight className="size-4" /></button></div> : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{plans.map((plan) => <Link key={plan.id} to={`/dashboard/plan/${plan.id}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition-colors hover:bg-white/[0.06]"><p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{plan.source === "ai" ? "KOVA draft" : "Manual"} · {plan.status}</p><h2 className="mt-8 font-serif text-3xl italic tracking-[-0.05em]">{plan.name}</h2><p className="mt-3 text-sm text-white/40">Open plan details <ArrowRight className="ml-1 inline size-4" /></p></Link>)}</div>}</div>
    </AppShell>
  );
}
