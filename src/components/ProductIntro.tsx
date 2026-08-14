import { motion } from "framer-motion";
import { SectionReveal } from "./KovaBackground";

const pillars = [
  { number: "01", title: "Adaptive training", question: "Your next workout changes.", description: "KOVA uses your last workout and recovery to pick the right session." },
  { number: "02", title: "Guided sessions", question: "Just open and train.", description: "Your sets, reps and rest times are ready, so you can focus on training." },
  { number: "03", title: "Progress that learns", question: "Feedback shapes what comes next.", description: "Tell KOVA how it felt. Your next workout adjusts from there." },
];

export function ProductIntro() {
  return (
    <section id="product" className="section-shell px-6 py-28 sm:py-36 lg:py-44">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div><p className="eyebrow">Your training, adapted to you</p><h2 className="section-title mt-5 max-w-md">A coach that <em>keeps learning.</em></h2></div>
          <div className="lg:pt-16"><p className="max-w-xl text-base leading-8 text-white/48 sm:text-lg">KOVA is for lifters who want a clear plan without building every workout themselves.</p></div>
        </div>
        <div className="mt-16 grid gap-3 md:mt-24 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.article key={pillar.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.55, delay: index * 0.07 }} whileHover={{ y: -5 }} className="liquid-glass group min-h-[270px] rounded-[1.6rem] p-7 sm:p-8">
              <div className="flex items-start justify-between"><span className="text-[10px] font-medium tracking-[0.2em] text-white/35">{pillar.number}</span><span className="size-1.5 rounded-full bg-white/35 transition-colors group-hover:bg-white" /></div>
              <h3 className="mt-16 font-serif text-3xl italic tracking-[-0.05em] text-white/90">{pillar.title}</h3>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-white/50">{pillar.question}</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/42">{pillar.description}</p>
            </motion.article>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
