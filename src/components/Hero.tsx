import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-[780px] items-center justify-center overflow-hidden px-6 pb-24 pt-36 sm:min-h-[860px] lg:pb-32">
      <div className="pointer-events-none absolute left-1/2 top-[27%] h-[400px] w-[min(70vw,760px)] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[110px]" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mb-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-white/48 sm:mb-10"
        >
          <span className="size-1 rounded-full bg-white/70" />
          Your AI fitness coach
          <span className="size-1 rounded-full bg-white/30" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.42, ease }}
          className="max-w-4xl font-serif text-[clamp(4rem,10vw,8.9rem)] leading-[0.83] tracking-[-0.07em] text-white"
        >
          Get stronger.
          <br />
          <em className="text-white/62">Live healthier.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.64, ease }}
          className="mt-9 max-w-xl text-sm leading-7 text-white/52 sm:mt-11 sm:text-base"
        >
          Kova AI creates personalized strength and hypertrophy workouts,
          guides you through every session, and adapts your training as you
          progress.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.78, ease }}
          className="mt-9 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => scrollTo("#waitlist")}
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]"
          >
            Join the Waitlist
            <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollTo("#how-it-works")}
            className="glass-pill inline-flex h-12 items-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
          >
            See How It Works
            <ArrowDown size={14} strokeWidth={1.5} />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          className="mt-20 flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.33em] text-white/38 sm:mt-28 sm:gap-5"
        >
          <span>Train smarter</span>
          <span className="text-white/20">—</span>
          <span>Progress faster</span>
          <span className="text-white/20">—</span>
          <span>Live healthier</span>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-6 hidden text-[9px] uppercase tracking-[0.25em] text-white/25 sm:block">
        iOS · Coming soon
      </div>
      <div className="absolute bottom-8 right-6 hidden items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-white/25 sm:flex">
        Scroll to explore <span className="h-px w-8 bg-white/20" />
      </div>
    </section>
  );
}
