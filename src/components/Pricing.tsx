import { ArrowUpRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SectionReveal } from "./KovaBackground";

const plans = [
  { name: "Free", audience: "For exploring Kova AI.", price: "€0", cadence: "/ month", features: ["Core AI access", "Basic workflows", "Limited usage", "Personal workspace"], popular: false, cta: "Join Waitlist" },
  { name: "Pro", audience: "For people who want more from AI.", price: "€19", cadence: "/ month", features: ["Advanced AI features", "Higher usage limits", "Advanced workflows", "Automation", "Priority access"], popular: true, cta: "Join Waitlist" },
  { name: "Business", audience: "For teams and growing companies.", price: "Custom", cadence: "", features: ["Team workflows", "Higher limits", "Advanced automation", "Collaboration", "Priority support"], popular: false, cta: "Contact us" },
];

export function Pricing() {
  const goToWaitlist = () => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="pricing" className="section-shell px-6 py-28 sm:py-36">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Launch pricing</p>
            <h2 className="section-title mt-5">Simple plans. <em>Powerful AI.</em></h2>
          </div>
          <p className="max-w-xs text-xs leading-5 text-white/35 sm:pb-1">Planned pricing shown for launch. Final details may change as Kova AI evolves.</p>
        </div>

        <div className="mt-14 grid gap-3 lg:mt-20 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article key={plan.name} whileHover={{ y: -5 }} transition={{ duration: 0.25 }} className={`relative flex flex-col rounded-[1.5rem] border p-6 sm:p-8 ${plan.popular ? "border-white/35 bg-white/[0.075]" : "border-white/[0.1] bg-white/[0.025]"}`}>
              {plan.popular && <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black">Most popular</span>}
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">0{index + 1}</span>
              <h3 className="mt-12 font-serif text-4xl italic tracking-[-0.05em] text-white/90">{plan.name}</h3>
              <p className="mt-3 min-h-12 max-w-[12rem] text-sm leading-6 text-white/42">{plan.audience}</p>
              <div className="mt-8 flex items-baseline gap-1 border-b border-white/[0.1] pb-7">
                <span className="text-3xl font-medium tracking-[-0.05em] text-white">{plan.price}</span>
                <span className="text-xs text-white/35">{plan.cadence}</span>
              </div>
              <ul className="flex-1 space-y-4 py-7">
                {plan.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm text-white/55"><Check size={14} strokeWidth={1.4} className="text-white/60" />{feature}</li>)}
              </ul>
              <button type="button" onClick={plan.name === "Business" ? () => { window.location.href = "mailto:hello@kova.ai?subject=Kova%20AI%20Business%20enquiry"; } : goToWaitlist} className={`group flex h-11 w-full items-center justify-center gap-3 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] ${plan.popular ? "bg-white text-black" : "border border-white/[0.14] text-white hover:bg-white/[0.06]"}`}>
                {plan.cta}
                <ArrowUpRight size={14} strokeWidth={1.6} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </motion.article>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
