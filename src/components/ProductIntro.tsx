import { motion } from "framer-motion";
import { SectionReveal } from "./KovaBackground";

const pillars = [
  {
    number: "01",
    title: "Automate",
    description: "Automate repetitive tasks and workflows with AI that works quietly in the background.",
  },
  {
    number: "02",
    title: "Optimize",
    description: "Use AI to improve the way you work, create and make decisions every day.",
  },
  {
    number: "03",
    title: "Elevate",
    description: "Turn ideas into better outcomes with intelligent assistance built around you.",
  },
];

export function ProductIntro() {
  return (
    <section id="product" className="section-shell px-6 py-28 sm:py-36 lg:py-44">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="eyebrow">A better way to work</p>
            <h2 className="section-title mt-5 max-w-md">
              AI, built around <em>your workflow.</em>
            </h2>
          </div>
          <div className="lg:pt-16">
            <p className="max-w-xl text-base leading-8 text-white/48 sm:text-lg">
              Kova AI helps you use artificial intelligence to simplify work,
              automate repetitive processes and get more done with less effort.
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
              transition={{ duration: 0.55, delay: index * 0.08 }}
              whileHover={{ y: -5 }}
              className="liquid-glass group min-h-[265px] rounded-[1.6rem] p-7 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/35">{pillar.number}</span>
                <span className="size-1.5 rounded-full bg-white/35 transition-colors group-hover:bg-white" />
              </div>
              <h3 className="mt-24 font-serif text-4xl italic tracking-[-0.05em] text-white/90">{pillar.title}</h3>
              <p className="mt-3 max-w-[18rem] text-sm leading-6 text-white/42">{pillar.description}</p>
            </motion.article>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
