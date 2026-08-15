import { motion } from "framer-motion";
import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductIntro } from "@/components/ProductIntro";
import { Waitlist } from "@/components/Waitlist";
import DotField from "@/components/DotField";

export default function Landing() {
  return (
    <main id="top" className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <Hero />
        <div className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.58]">
            <DotField
              dotRadius={5}
              dotSpacing={20}
              bulgeStrength={67}
              glowRadius={160}
              sparkle={false}
              waveAmplitude={0}
              gradientFrom="#ffffff"
              gradientTo="#ffffff"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_16%,rgba(0,0,0,0.12)_54%,rgba(0,0,0,0.9)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-56 bg-gradient-to-b from-black via-black/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-64 bg-gradient-to-t from-black via-black/65 to-transparent" />

          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[46%] z-[2] h-[min(88vw,940px)] w-[min(88vw,940px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.045]"
            animate={{ rotate: [0, 5, -3, 0], scale: [1, 1.018, 0.99, 1] }}
            transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[56%] z-[2] h-[min(55vw,580px)] w-[min(55vw,580px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]"
            animate={{ rotate: [0, -7, 4, 0], scale: [1, 0.985, 1.02, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10">
            <ProductIntro />
            <Waitlist />
          </div>
        </div>
      </div>
    </main>
  );
}
