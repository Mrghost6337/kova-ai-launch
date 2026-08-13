import { SectionReveal } from "./KovaBackground";

const features = [
  {
    index: "01",
    title: "AI Assistance",
    description: "Create, analyze, write, research and solve problems faster with powerful tools that feel natural.",
  },
  {
    index: "02",
    title: "Automation",
    description: "Reduce repetitive work by letting AI handle recurring processes and workflows for you.",
  },
  {
    index: "03",
    title: "Productivity",
    description: "Bring AI into your everyday workflow so you can spend more time on meaningful work.",
  },
  {
    index: "04",
    title: "Intelligent Workflows",
    description: "Connect tasks and processes into smarter, AI-powered workflows that keep momentum moving.",
  },
  {
    index: "05",
    title: "One Platform",
    description: "Keep your AI tools and workflows organized in one simple, focused experience.",
  },
];

export function Features() {
  return (
    <section id="features" className="section-shell border-t border-white/[0.07] px-6 py-28 sm:py-36">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">The Kova system</p>
            <h2 className="section-title mt-5 max-w-2xl">Everything you need to <em>work with AI.</em></h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-white/38 md:pb-1">One calm, capable layer between your ideas and the work that follows.</p>
        </div>

        <div className="mt-16 border-t border-white/[0.1] sm:mt-24">
          {features.map((feature) => (
            <article key={feature.index} className="group grid gap-5 border-b border-white/[0.1] py-7 transition-colors hover:bg-white/[0.025] sm:grid-cols-[5rem_1fr_1fr] sm:items-center sm:gap-8 sm:px-4">
              <span className="text-[10px] tracking-[0.2em] text-white/30">{feature.index}</span>
              <h3 className="font-serif text-3xl tracking-[-0.04em] text-white/88 transition-colors group-hover:text-white sm:text-4xl">{feature.title}</h3>
              <p className="max-w-sm text-sm leading-6 text-white/42">{feature.description}</p>
            </article>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
