import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { getPerf } from "@/lib/perf";
import Silk from "./Silk";
import { KovaLogo } from "./KovaLogo";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const lowTier = getPerf().tier === "low";
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 85, damping: 24, mass: 0.7 });
  const backgroundY = useTransform(smoothProgress, [0, 1], [0, 90]);
  const backgroundScale = useTransform(smoothProgress, [0, 1], [1, 1.08]);
  const backgroundOpacity = useTransform(smoothProgress, [0, 1], [0.68, 0.12]);
  const contentY = useTransform(smoothProgress, [0, 1], [0, -76]);
  const contentOpacity = useTransform(smoothProgress, [0, 0.72, 1], [1, 0.92, 0.14]);
  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section ref={heroRef} className="relative flex min-h-[780px] items-center justify-center overflow-hidden px-6 pb-24 pt-36 sm:min-h-[860px] lg:pb-32">
      <motion.div style={lowTier ? { opacity: 0.68 } : { y: backgroundY, scale: backgroundScale, opacity: backgroundOpacity }} className="pointer-events-none absolute inset-0 z-0">
        <Silk
          speed={8.9}
          scale={1.4}
          color="#7B7481"
          noiseIntensity={0.6}
          rotation={0}
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/20 to-black/75" />
      <div className="pointer-events-none absolute left-1/2 top-[27%] z-[2] h-[400px] w-[min(70vw,760px)] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[110px]" />
      <motion.div style={lowTier ? undefined : { y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease }} className="mb-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-white/48 sm:mb-10">
          <KovaLogo className="size-6 shrink-0 rounded-[23%] ring-1 ring-white/10" />
          <span>KOVA AI · Your training, adapted to you</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.42, ease }} className="max-w-4xl font-display text-[clamp(3.7rem,9.5vw,8.6rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white">
          Train smarter.<br /><em className="text-white/62">Get stronger.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.64, ease }} className="mt-9 max-w-xl text-sm leading-7 text-white/52 sm:mt-11 sm:text-base">
          KOVA builds your workout, guides each set, and changes your plan as you progress.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.78, ease }} className="mt-9 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row">
          <button type="button" onClick={() => navigate("/app")} className="group inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]">
            Explore KOVA AI <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
          <button type="button" onClick={() => scrollTo("#product")} className="glass-pill inline-flex h-12 items-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white">
            How it works <ArrowDown size={14} strokeWidth={1.5} />
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.05 }} className="mt-20 flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.33em] text-white/38 sm:mt-28 sm:gap-5">
          <span>Perform</span><span className="text-white/20">—</span><span>Recover</span><span className="text-white/20">—</span><span>Adapt</span>
        </motion.div>
      </motion.div>
      <div className="absolute bottom-8 left-6 hidden text-[9px] uppercase tracking-[0.25em] text-white/25 sm:block">iOS · Coming soon</div>
      <div className="absolute bottom-8 right-6 hidden items-center gap-3 text-[9px] uppercase tracking-[0.25em] text-white/25 sm:flex">Scroll to explore <span className="h-px w-8 bg-white/20" /></div>
    </section>
  );
}
