import { motion } from "framer-motion";
import { SectionReveal } from "./KovaBackground";

const audiences = [
  {
    number: "01",
    title: "Beginners",
    question: "Not sure where to start?",
    description: "Kova AI gives you structured workouts and clear guidance so you can start training with confidence.",
  },
  {
    number: "02",
    title: "Lifters",
    question: "Already training?",
    description: "Get structured strength and hypertrophy programming without spending hours creating your own workouts.",
  },
  {
    number: "03",
    title: "Health & fitness",
    question: "Want to feel more active?",
    description: "Kova AI gives you a simple reason to move, train and build better habits.",
  },
  {
    number: "04",
    title: "Busy people",
    question: "Don&apos;t have time to plan?",
    description: "Open the app and know exactly what to do for your next workout.",
  },
];

export function ProductIntro() {
  return (
    <section id="goals" className="section-shell px-6 py-28 sm:py-36 lg:py-44">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="eyebrow">Training for real life</p>
            <h2 className="section-title mt-5 max-w-md">
              Built for <em>your goals.</em>
            </h2>
          </div>
          <div className="lg:pt-16">
            <p className="max-w-xl text-base leading-8 text-white/48 sm:text-lg">
              Kova AI is not only for experienced lifters. Whether you are
              starting from scratch, building muscle or trying to move more,
              it gives you the structure to keep going.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 md:mt-24">
          {audiences.map((audience, index) => (
            <motion.article
              key={audience.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.07 }}
              whileHover={{ y: -5 }}
              className="liquid-glass group min-h-[245px] rounded-[1.6rem] p-7 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/35">{audience.number}</span>
                <span className="size-1.5 rounded-full bg-white/35 transition-colors group-hover:bg-white" />
              </div>
              <h3 className="mt-16 font-serif text-3xl italic tracking-[-0.05em] text-white/90">{audience.title}</h3>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-white/50">{audience.question}</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/42">{audience.description}</p>
            </motion.article>
          ))}
        </div>
      </SectionReveal>
    </section>
  );
}
