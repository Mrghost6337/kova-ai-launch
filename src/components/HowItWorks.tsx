import { SectionReveal } from "./KovaBackground";

const steps = [
  { number: "01", title: "Connect", description: "Bring your workflow into Kova AI." },
  { number: "02", title: "Automate", description: "Let AI handle repetitive work." },
  { number: "03", title: "Elevate", description: "Use the time saved to focus on bigger ideas." },
];

export function HowItWorks() {
  return (
    <section className="section-shell px-6 py-28 sm:py-36">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="mb-14 flex items-end justify-between gap-5 sm:mb-20">
          <div>
            <p className="eyebrow">A simpler loop</p>
            <h2 className="section-title mt-5">How Kova <em>works.</em></h2>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-white/25 sm:block">From friction to flow</span>
        </div>

        <div className="grid border-y border-white/[0.1] md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className={`relative py-8 sm:py-11 md:px-8 ${index > 0 ? "border-t border-white/[0.1] md:border-l md:border-t-0" : ""}`}>
              <span className="text-[10px] tracking-[0.2em] text-white/32">{step.number}</span>
              <h3 className="mt-14 font-serif text-4xl italic tracking-[-0.04em] text-white/90 sm:mt-20">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/42">{step.description}</p>
              {index < steps.length - 1 && <span className="absolute -right-1.5 top-1/2 hidden size-2.5 rounded-full border border-white/30 bg-black md:block" />}
            </div>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
