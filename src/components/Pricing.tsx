import { api } from "@/convex/_generated/api";
import { useCheckout, type BillingInterval } from "@/hooks/use-checkout";
import { ArrowUpRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useState } from "react";

const features: Record<string, string[]> = {
  pro: [
    "Adaptive AI training",
    "Personalized strength workouts",
    "Guided sessions with set logging",
    "Progress and training history",
    "Feedback that shapes your next workout",
    "Apple Health connection",
  ],
  ultra: [
    "Everything in KOVA PRO",
    "KOVA's highest level of coaching",
    "More guidance through each phase",
    "Stronger support as you progress",
    "The complete KOVA experience",
    "Full data and account controls",
  ],
};

export function Pricing() {
  const plans = useQuery(api.plans.plans);
  const { buy, isLoading } = useCheckout();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");

  if (!plans) {
    return <div className="px-6 py-40" />;
  }

  return (
    <section id="pricing" className="section-shell px-6 pb-28 sm:pb-36">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-center">
          <div className="glass-pill inline-flex items-center gap-1 p-1">
            {(["month", "year"] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setBillingInterval(interval)}
                className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${billingInterval === interval ? "bg-white text-black" : "text-white/45 hover:text-white"}`}
              >
                {interval === "month" ? "Monthly" : "Annual · Save"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {plans.map((plan, index) => {
            const isAnnual = billingInterval === "year";
            const price = isAnnual ? plan.annualPriceLabel : plan.monthlyPriceLabel;
            const cadence = isAnnual ? "/ year" : "/ month";

            return (
              <motion.article
                key={plan.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
                className={`relative flex flex-col rounded-[1.5rem] border p-6 sm:p-8 ${plan.popular ? "border-white/35 bg-white/[0.075]" : "border-white/[0.1] bg-white/[0.025]"}`}
              >
                {plan.popular && (
                  <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-black">
                    Most chosen
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  0{index + 1}
                </span>
                <h3 className="mt-12 font-serif text-4xl italic tracking-[-0.05em] text-white/90">
                  {plan.name}
                </h3>
                <p className="mt-3 min-h-12 max-w-sm text-sm leading-6 text-white/42">
                  {plan.description}
                </p>
                <div className="mt-8 flex items-baseline gap-1 border-b border-white/[0.1] pb-7">
                  <span className="text-3xl font-medium tracking-[-0.05em] text-white">
                    {price}
                  </span>
                  <span className="text-xs text-white/35">{cadence}</span>
                </div>
                <ul className="flex-1 space-y-4 py-7">
                  {(features[plan.id] ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/55">
                      <Check size={14} strokeWidth={1.4} className="mt-0.5 shrink-0 text-white/60" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => buy(plan.id, billingInterval)}
                  disabled={isLoading}
                  className={`group flex h-11 w-full items-center justify-center gap-3 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-transform hover:scale-[1.02] disabled:opacity-60 ${plan.popular ? "bg-white text-black" : "border border-white/[0.14] text-white hover:bg-white/[0.06]"}`}
                >
                  {isLoading ? "Opening checkout…" : `Choose ${plan.name.replace("KOVA ", "")}`}
                  <ArrowUpRight size={14} strokeWidth={1.6} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </motion.article>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.14em] text-white/25">
          Cancel anytime · Secure checkout · iOS app coming soon
        </p>
      </div>
    </section>
  );
}
