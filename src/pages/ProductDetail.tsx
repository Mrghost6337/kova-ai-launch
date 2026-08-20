import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Silk from "@/components/Silk";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

const features = [
  "Workouts that change with your progress",
  "Personalized strength workouts",
  "Guided sessions with set logging and rest timers",
  "Track sessions, volume, PRs and progress",
  "Feedback that shapes your next workout",
  "Training history and phases",
  "Apple Health for iPhone",
  "Reminders, sync, export and account tools",
];

function ScreenshotCard({ src, alt, label, className = "" }: { src: string; alt: string; label: string; className?: string }) {
  return (
    <div className={`liquid-glass rounded-[2.5rem] border-white/20 p-2 ${className}`}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-[#0c0c0e]">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white/35">
          <span className="font-serif text-2xl italic text-white/70">KOVA</span>
          <span className="mt-2 text-[10px] uppercase tracking-[0.18em]">{label} screen</span>
        </div>
        <img
          src={src}
          alt={alt}
          className="relative z-10 block h-full w-full object-cover"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <section className="relative flex min-h-[780px] items-center overflow-hidden px-6 pb-20 pt-36 sm:min-h-[820px] lg:px-12 lg:pt-40">
          <div className="pointer-events-none absolute inset-0 z-0">
            <Silk
              speed={8.9}
              scale={1.4}
              color="#7B7481"
              noiseIntensity={0.6}
              rotation={0}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/15 via-black/25 to-black/85" />
          <div className="pointer-events-none absolute left-1/2 top-[30%] z-[2] h-[380px] w-[min(70vw,720px)] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[110px]" />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Link
                to="/"
                className="mb-10 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
              >
                <ArrowLeft size={13} strokeWidth={1.5} /> Back to KOVA AI
              </Link>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="eyebrow">KOVA AI · iPhone app</p>
                <h1 className="mt-6 max-w-2xl font-serif text-[clamp(3.2rem,8vw,6.4rem)] leading-[0.86] tracking-[-0.07em] text-white">
                  Your training. <em className="text-white/55">Adapted to you.</em>
                </h1>
                <p className="mt-8 max-w-md text-base leading-8 text-white/50">
                  A clear plan, a coach for every set, and a history that shows
                  your progress.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/pricing"
                    className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]"
                  >
                    See plans
                    <ArrowUpRight
                      size={15}
                      strokeWidth={1.8}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                  <Link
                    to="/"
                    className="glass-pill inline-flex h-12 items-center justify-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
                  >
                    Back to home
                  </Link>
                </div>
                <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">
                  For beginners and lifters · Coming soon to iOS
                </p>
              </motion.div>
            </div>
            <div className="grid grid-cols-2 items-start gap-3 sm:gap-5">
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <ScreenshotCard src="/assets/kova-coach.png" alt="KOVA Coach screen" label="Coach" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
              >
                <ScreenshotCard src="/assets/kova-history.png" alt="KOVA History screen" label="History" className="mt-12 sm:mt-20" />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.07] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="eyebrow">What KOVA does</p>
              <h2 className="section-title mt-5">A coach that <em>keeps learning.</em></h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/45">
                KOVA looks at your training and feedback, then makes the next
                session better.
              </p>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-0 border-t border-white/[0.1] sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={feature} className="flex gap-4 border-b border-white/[0.1] py-5">
                  <span className="pt-0.5 text-[10px] tracking-[0.2em] text-white/30">0{index + 1}</span>
                  <p className="text-sm leading-6 text-white/55">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
