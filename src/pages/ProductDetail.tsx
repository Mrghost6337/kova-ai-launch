import { api } from "@/convex/_generated/api";
import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCheckout, type BillingInterval } from "@/hooks/use-checkout";
import { Activity, ArrowLeft, ArrowUpRight, CalendarDays, Check, Dumbbell, Flame, Play, RefreshCw, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router";

const features = [
  "Workouts that change with your progress",
  "Personalized strength workouts",
  "Guided sessions with set logging and rest timers",
  "Track sessions, volume, PRs and progress",
  "Feedback that shapes your next workout",
  "Training history and phases",
  "Apple Health for iPhone",
  "Reminders, sync, export and account tools",
];

const coachingLevels: Record<string, string[]> = {
  pro: [
    "The complete KOVA training experience",
    "Workouts built around your goals",
    "Guided sessions and steady progress",
    "Your feedback shapes the next workout",
  ],
  ultra: [
    "Everything in KOVA PRO",
    "KOVA's highest level of coaching",
    "More guidance through each phase",
    "The ultimate KOVA experience for serious lifters",
  ],
};

function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`liquid-glass rounded-[2.5rem] border-white/20 p-2 ${className}`}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-black px-3.5 pb-5 pt-3 text-white sm:px-4">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#050505]" />
        {children}
      </div>
    </div>
  );
}

function PhoneStatus() {
  return (
    <div className="flex items-center justify-between px-2 pt-1 text-[9px] font-semibold text-white/90">
      <span>9:42</span>
      <div className="flex items-center gap-1.5 text-white/50"><span>••••</span><span className="text-[11px]">◔</span><span className="rounded-[3px] border border-white/60 px-1 py-0.5">▰</span></div>
    </div>
  );
}

function PhoneNav() {
  return (
    <div className="absolute inset-x-5 bottom-3 z-10 grid grid-cols-3 rounded-full border border-white/[0.14] bg-[#1a1a1c]/95 p-1 text-center shadow-[0_8px_25px_rgba(0,0,0,0.5)]">
      <div className="rounded-full bg-white/[0.12] px-1 py-2 text-[8px] text-white"><Dumbbell className="mx-auto mb-1 size-3.5" />Coach</div>
      <div className="px-1 py-2 text-[8px] text-white/55"><Activity className="mx-auto mb-1 size-3.5" />History</div>
      <div className="px-1 py-2 text-[8px] text-white/55"><CalendarDays className="mx-auto mb-1 size-3.5" />Plan</div>
    </div>
  );
}

function CoachPreview() {
  return (
    <PhoneFrame className="relative z-10 w-full">
      <PhoneStatus />
      <div className="mt-12 flex items-center justify-between px-2">
        <div><p className="text-[8px] text-white/45">Today</p><p className="mt-1 text-xl font-semibold tracking-[-0.06em]">August 13</p></div>
        <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-white/[0.1]"><Flame className="size-4" /></span><span className="text-sm">3</span><span className="ml-1 flex size-8 items-center justify-center rounded-full bg-white/[0.1]"><Settings className="size-4" /></span></div>
      </div>
      <div className="mt-7 rounded-[1.35rem] border border-white/[0.12] bg-[#111113] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.3)]">
        <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-white/50">Progress day</p>
        <h3 className="mt-5 max-w-[8rem] text-[2.15rem] font-semibold leading-[0.94] tracking-[-0.08em]">Push<br />performance</h3>
        <div className="mt-7 grid grid-cols-3 gap-2"><div><p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Time</p><p className="mt-1 text-sm font-semibold">58 min</p></div><div><p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Sets</p><p className="mt-1 text-sm font-semibold">13</p></div><div><p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Focus</p><p className="mt-1 text-sm font-semibold">Push</p></div></div>
        <button type="button" className="mt-7 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-semibold text-black"><Play className="size-3 fill-current" /> Start session</button>
        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-white/70"><RefreshCw className="size-3.5" /> Swap or regenerate</div>
      </div>
      <div className="mt-3 rounded-[1.15rem] border border-white/[0.1] bg-[#111113] p-3.5"><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]"><Activity className="size-4" /></span><div><p className="text-xs font-semibold">Why this session</p><p className="mt-1 text-[10px] leading-4 text-white/50">Your last pull session was controlled. Push volume is ready to progress.</p></div></div></div>
      <PhoneNav />
    </PhoneFrame>
  );
}

function HistoryPreview() {
  return (
    <PhoneFrame className="mt-12 w-full sm:mt-20">
      <PhoneStatus />
      <div className="mt-12 px-2"><div className="flex items-center justify-between"><h3 className="text-2xl font-semibold tracking-[-0.07em]">History</h3><span className="flex size-8 items-center justify-center rounded-full bg-white/[0.1]"><Flame className="size-4" /></span></div><div className="mt-1 flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Your recent work</p><span className="text-sm">3</span></div></div>
      <div className="mt-6 rounded-[1.2rem] border border-white/[0.12] bg-[#111113] p-4"><p className="text-[8px] font-medium uppercase tracking-[0.25em] text-white/45">Consistency</p><p className="mt-5 text-[2.7rem] font-semibold leading-none tracking-[-0.1em]">3 days</p><p className="mt-4 text-[10px] leading-4 text-white/45">Keep your turn going with one focused session each day.</p><div className="mt-5 flex justify-between text-[8px] text-white/45">{["F", "S", "S", "M", "T", "W", "T"].map((day, index) => <div key={`${day}-${index}`} className="text-center"><span>{day}</span><span className={`mx-auto mt-2 block size-2 rounded-full ${index > 0 && index < 6 ? "bg-white" : "bg-white/20"}`} /></div>)}</div></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/[0.1] bg-[#111113] p-3"><p className="text-[8px] uppercase tracking-[0.2em] text-white/40">This week</p><p className="mt-2 text-base font-semibold">4 sessions</p></div><div className="rounded-xl border border-white/[0.1] bg-[#111113] p-3"><p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Volume</p><p className="mt-2 text-base font-semibold">36k kg</p></div></div>
      <p className="mt-7 px-1 text-lg font-semibold tracking-[-0.05em]">Sessions</p>
      <div className="mt-3 space-y-2"><div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111113] p-3"><div><p className="text-xs font-medium">Pull performance</p><p className="mt-1 text-[9px] text-white/40">Thursday, Aug 13</p></div><div className="text-right"><p className="text-xs">46 min</p><p className="mt-1 text-[9px] text-white/40">RPE 7</p></div></div><div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111113] p-3"><div><p className="text-xs font-medium">Legs performance</p><p className="mt-1 text-[9px] text-white/40">Wednesday, Aug 12</p></div><div className="text-right"><p className="text-xs">47 min</p><p className="mt-1 text-[9px] text-white/40">RPE 8</p></div></div></div>
      <PhoneNav />
    </PhoneFrame>
  );
}

export default function ProductDetail() {
  const plans = useQuery(api.plans.plans);
  const { buy, isLoading, error } = useCheckout();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <section className="px-6 pb-24 pt-36 lg:px-12 lg:pt-44">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Link to="/" className="mb-10 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"><ArrowLeft size={13} strokeWidth={1.5} /> Back to KOVA AI</Link>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <p className="eyebrow">KOVA AI · iPhone app</p>
                <h1 className="mt-6 max-w-2xl font-serif text-[clamp(3.4rem,8vw,6.8rem)] leading-[0.86] tracking-[-0.07em] text-white">Your training. <em className="text-white/55">Adapted to you.</em></h1>
                <p className="mt-8 max-w-md text-base leading-8 text-white/50">A clear training plan, a coach for every set, and a history that shows your progress.</p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => buy("pro", billingInterval)} disabled={isLoading} className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03] disabled:opacity-60">{isLoading ? "Opening checkout…" : "Choose KOVA PRO"}<ArrowUpRight size={15} strokeWidth={1.8} /></button><a href="#plans" className="glass-pill inline-flex h-12 items-center justify-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white">See plans</a></div>
                {error && <p className="mt-4 max-w-md text-xs text-white/60">{error}</p>}
                <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">For intermediate lifters · Coming soon to iOS</p>
              </motion.div>
            </div>
            <div className="grid grid-cols-2 items-start gap-3 sm:gap-5"><motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}><CoachPreview /></motion.div><motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.22 }}><HistoryPreview /></motion.div></div>
          </div>
        </section>

        <section className="border-t border-white/[0.07] px-6 py-24 lg:px-12"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="eyebrow">What KOVA does</p><h2 className="section-title mt-5">A coach that <em>keeps learning.</em></h2><p className="mt-6 max-w-xl text-base leading-8 text-white/45">KOVA looks at your training and feedback, then helps you make the next session better.</p></div><div className="mt-12 grid gap-x-8 gap-y-0 border-t border-white/[0.1] sm:grid-cols-2 lg:grid-cols-3">{features.map((feature, index) => <div key={feature} className="flex gap-4 border-b border-white/[0.1] py-5"><span className="pt-0.5 text-[10px] tracking-[0.2em] text-white/30">0{index + 1}</span><p className="text-sm leading-6 text-white/55">{feature}</p></div>)}</div></div></section>

        <section id="plans" className="scroll-mt-24 px-6 py-24 lg:px-12"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Paid coaching plans</p><h2 className="section-title mt-5">Choose your <em>level.</em></h2></div><div className="glass-pill inline-flex self-start items-center gap-1 p-1 sm:self-end">{(["month", "year"] as const).map((interval) => <button key={interval} type="button" onClick={() => setBillingInterval(interval)} className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${billingInterval === interval ? "bg-white text-black" : "text-white/45 hover:text-white"}`}>{interval === "month" ? "Monthly" : "Annual · Save"}</button>)}</div></div><div className="mt-12 grid gap-3 lg:grid-cols-2">{(plans ?? []).map((plan, index) => { const isAnnual = billingInterval === "year"; return <motion.article key={plan.id} whileHover={{ y: -5 }} transition={{ duration: 0.25 }} className={`relative flex flex-col rounded-[1.5rem] border p-6 sm:p-8 ${plan.popular ? "border-white/35 bg-white/[0.075]" : "border-white/[0.1] bg-white/[0.025]"}`}>{plan.popular && <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black">Most chosen</span>}<span className="text-[10px] uppercase tracking-[0.2em] text-white/40">0{index + 1}</span><h3 className="mt-12 font-serif text-4xl italic tracking-[-0.05em] text-white/90">{plan.name}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-white/42">{plan.description}</p><div className="mt-8 flex items-baseline gap-1 border-b border-white/[0.1] pb-7"><span className="text-3xl font-medium tracking-[-0.05em] text-white">{isAnnual ? plan.annualPriceLabel : plan.monthlyPriceLabel}</span><span className="text-xs text-white/35">{isAnnual ? "/ year" : "/ month"}</span></div><ul className="flex-1 space-y-4 py-7">{(coachingLevels[plan.id] ?? []).map((item) => <li key={item} className="flex items-start gap-3 text-sm text-white/55"><Check size={14} strokeWidth={1.4} className="mt-0.5 shrink-0 text-white/60" />{item}</li>)}</ul><button type="button" onClick={() => buy(plan.id, billingInterval)} disabled={isLoading} className={`group flex h-11 w-full items-center justify-center gap-3 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] disabled:opacity-60 ${plan.popular ? "bg-white text-black" : "border border-white/[0.14] text-white hover:bg-white/[0.06]"}`}>{isLoading ? "Opening checkout…" : `Choose ${plan.name.replace("KOVA ", "")}`}<ArrowUpRight size={14} strokeWidth={1.6} /></button></motion.article>; })}</div></div></section>
        <Footer />
      </div>
    </main>
  );
}
