import { api } from "@/convex/_generated/api";
import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCheckout } from "@/hooks/use-checkout";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Link } from "react-router";

const features: Record<string, string[]> = {
  free: ["Core AI access", "Basic workflows", "Limited usage", "Personal workspace"],
  pro: ["Advanced AI features", "Higher usage limits", "Advanced workflows", "Automation", "Priority access"],
  business: ["Team workflows", "Higher limits", "Advanced automation", "Collaboration", "Priority support"],
};

const highlights = [
  ["Automate", "Let Kova AI handle repetitive tasks and routines for you."],
  ["Optimize", "Work, create and decide faster with smarter AI assistance."],
  ["Elevate", "Turn quick ideas into polished results from your phone."],
];

export default function ProductDetail() {
  const plans = useQuery(api.plans.plans);
  const { buy, isLoading, error } = useCheckout();

  const handleCta = (planId: string) => {
    if (planId === "free") return;
    if (planId === "business") {
      window.location.href = "mailto:hello@kova.ai?subject=Kova%20AI%20Business%20enquiry";
      return;
    }
    buy(planId);
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />

      <div className="relative z-10">
        {/* Hero */}
        <section className="grid items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1fr_0.9fr] lg:gap-20 lg:px-12 lg:pt-44">
          <div>
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white">
              <ArrowLeft size={13} strokeWidth={1.5} /> Back to Kova AI
            </Link>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p className="eyebrow">Kova AI · iPhone</p>
              <h1 className="mt-6 font-serif text-[clamp(3.4rem,8vw,6.8rem)] leading-[0.86] tracking-[-0.07em] text-white">
                The AI app for <em className="text-white/55">everything you do.</em>
              </h1>
              <p className="mt-8 max-w-md text-base leading-8 text-white/50">
                Kova AI puts powerful AI tools into one elegant iPhone app.
                Automate the repetitive, sharpen the everyday and turn ideas
                into results — from anywhere.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => buy("pro")} disabled={isLoading} className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03] disabled:opacity-60">
                  {isLoading ? "Opening checkout…" : "Get Kova AI"}
                  <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <a href="#plans" className="glass-pill inline-flex h-12 items-center justify-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white">Compare plans</a>
              </div>
              {error && <p className="mt-4 max-w-md text-xs text-white/60">{error}</p>}
              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">Free to start · Requires iOS 17+</p>
            </motion.div>
          </div>

          {/* CSS phone mockup */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[290px] lg:max-w-[320px]">
            <div className="liquid-glass relative rounded-[2.6rem] border-white/20 p-2.5">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] bg-black px-4 py-8">
                <div className="absolute left-1/2 top-2.5 h-5 w-24 -translate-x-1/2 rounded-full bg-white/90" />
                <div className="pt-10">
                  <div className="font-serif text-2xl italic tracking-[-0.05em] text-white">Kova AI</div>
                  <div className="mt-6 h-px w-full bg-white/10" />
                  <div className="mt-5 space-y-3">
                    <div className="h-11 rounded-xl bg-white/[0.06]" />
                    <div className="h-11 rounded-xl bg-white/[0.06]" />
                    <div className="h-11 rounded-xl bg-white/10" />
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-white/35">
                    <span className="size-1 rounded-full bg-white/50" /> Automate · Optimize · Elevate
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Highlights */}
        <section className="border-t border-white/[0.07] px-6 py-24 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
            {highlights.map(([title, description], index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: index * 0.08 }} className="rounded-[1.4rem] border border-white/[0.1] bg-white/[0.025] p-7">
                <span className="text-[10px] tracking-[0.2em] text-white/35">0{index + 1}</span>
                <h3 className="mt-12 font-serif text-3xl italic tracking-[-0.04em] text-white/90">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/42">{description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="scroll-mt-24 px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="eyebrow">Plans & pricing</p>
              <h2 className="section-title mx-auto mt-5 max-w-2xl">Choose your <em>Kova AI.</em></h2>
            </div>
            <div className="mt-14 grid gap-3 lg:mt-20 lg:grid-cols-3">
              {(plans ?? []).map((plan, index) => (
                <motion.article key={plan.id} whileHover={{ y: -5 }} transition={{ duration: 0.25 }} className={`relative flex flex-col rounded-[1.5rem] border p-6 sm:p-8 ${plan.popular ? "border-white/35 bg-white/[0.075]" : "border-white/[0.1] bg-white/[0.025]"}`}>
                  {plan.popular && <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black">Most popular</span>}
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">0{index + 1}</span>
                  <h3 className="mt-12 font-serif text-4xl italic tracking-[-0.05em] text-white/90">{plan.name}</h3>
                  <p className="mt-3 min-h-12 max-w-[12rem] text-sm leading-6 text-white/42">{plan.description}</p>
                  <div className="mt-8 flex items-baseline gap-1 border-b border-white/[0.1] pb-7">
                    <span className="text-3xl font-medium tracking-[-0.05em] text-white">{plan.priceLabel}</span>
                    <span className="text-xs text-white/35">{plan.cadence}</span>
                  </div>
                  <ul className="flex-1 space-y-4 py-7">
                    {(features[plan.id] ?? []).map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-white/55"><Check size={14} strokeWidth={1.4} className="text-white/60" />{feature}</li>)}
                  </ul>
                  <button type="button" onClick={() => handleCta(plan.id)} disabled={isLoading && plan.id === "pro"} className={`group flex h-11 w-full items-center justify-center gap-3 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] disabled:opacity-60 ${plan.popular ? "bg-white text-black" : "border border-white/[0.14] text-white hover:bg-white/[0.06]"}`}>
                    {plan.id === "free" ? "Get the app" : plan.id === "business" ? "Contact us" : isLoading ? "Opening checkout…" : "Get Pro"}
                    <ArrowUpRight size={14} strokeWidth={1.6} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
