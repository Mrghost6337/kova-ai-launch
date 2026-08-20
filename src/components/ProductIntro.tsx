import { motion } from "framer-motion";
import { SectionReveal } from "./KovaBackground";

const pillars = [
  {
    number: "01",
    title: "Clear direction",
    question: "Always know what comes next.",
    description: "KOVA gives you a workout to follow, so you never have to build every session from scratch.",
  },
  {
    number: "02",
    title: "Guided movement",
    question: "See it. Set up. Get moving.",
    description: "Visual exercise guidance helps you understand the movement before you start your set.",
  },
  {
    number: "03",
    title: "Adaptive coaching",
    question: "You train. KOVA learns.",
    description: "Log how your workout went and KOVA uses that feedback to shape what comes next.",
  },
];

export function ProductIntro() {
  return (
    <section id="product" className="section-shell px-6 py-28 sm:py-36 lg:py-44">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="eyebrow">Your training, adapted to you</p>
            <h2 className="section-title mt-5 max-w-md">A coach that <em>keeps learning.</em></h2>
          </div>
          <div className="lg:pt-16">
            <p className="max-w-xl text-base leading-8 text-white/48 sm:text-lg">
              You do not need to know how to train before using KOVA. Open the
              app, follow the plan, log your sets, and let your training get
              smarter as you get stronger.
            </p>
          </div>
        </div>
        <div className="mt-16 grid gap-3 md:mt-24 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.07 }}
              whileHover={{ y: -5 }}
              className="liquid-glass group min-h-[270px] rounded-[1.6rem] p-7 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/35">{pillar.number}</span>
                <span className="size-1.5 rounded-full bg-white/35 transition-colors group-hover:bg-white" />
              </div>
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
