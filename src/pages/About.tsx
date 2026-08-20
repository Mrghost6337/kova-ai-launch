import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, Dumbbell, Play, Timer, TrendingUp } from "lucide-react";
import { KovaBackground, SectionReveal } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

const problems = [
  "Walking into the gym without knowing what to do",
  "Second-guessing exercises, sets, reps, and technique",
  "Spending more time logging than training",
  "Building every workout from scratch",
  "Not knowing if the work is actually adding up",
];

const coachingSteps = [
  { number: "01", label: "Exercise", detail: "Know exactly what to do." },
  { number: "02", label: "Set", detail: "Follow clear guidance." },
  { number: "03", label: "Log", detail: "Record it in seconds." },
  { number: "04", label: "Rest", detail: "Recover, then go again." },
  { number: "05", label: "Next set", detail: "Keep moving forward." },
];

const progressItems = [
  { icon: TrendingUp, label: "Strength", detail: "See what is getting stronger." },
  { icon: Dumbbell, label: "Consistency", detail: "Build a training habit that lasts." },
  { icon: Timer, label: "Performance", detail: "Understand how your sessions are changing." },
];

export default function About() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <Seo
        title="About KOVA AI — Your Adaptive Strength Coach"
        description="KOVA AI tells you what to do, shows you how to do it, makes logging fast, and adapts as you get stronger. Built for beginners and lifters alike."
        path="/about"
      />

      <div className="relative z-10">
        <section className="relative flex min-h-[760px] items-center px-6 pb-24 pt-40 sm:min-h-[820px] lg:px-12 lg:pt-44">
          <div className="mx-auto w-full max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl"
            >
              <p className="eyebrow">About KOVA AI · Strength & hypertrophy coaching</p>
              <h1 className="mt-7 max-w-4xl font-serif text-[clamp(4rem,10vw,8.8rem)] leading-[0.84] tracking-[-0.075em] text-white">
                Your training. <em className="text-white/55">Smarter.</em>
              </h1>
              <p className="mt-9 max-w-2xl text-lg leading-8 text-white/52 sm:text-xl">
                KOVA tells you what to do, shows you how to do it, makes logging
                feel effortless, and gets smarter as you train.
              </p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/35">
                Built for beginners starting their fitness journey and lifters
                who want a clearer, more adaptive way to get stronger.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/#waitlist"
                  className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]"
                >
                  Join the waitlist
                  <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="#the-problem"
                  className="glass-pill inline-flex h-12 items-center justify-center gap-3 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
                >
                  See how it works <ArrowDown size={14} strokeWidth={1.5} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="the-problem" className="section-shell border-t border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
              <div>
                <p className="eyebrow">The problem</p>
                <h2 className="section-title mt-5 max-w-md">The gym is hard enough <em>without the guesswork.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  Starting a workout should not feel like starting a research
                  project. Too many people are expected to choose the exercises,
                  build the plan, learn the technique, and track everything on
                  their own.
                </p>
                <div className="mt-10 border-t border-white/[0.1]">
                  {problems.map((problem, index) => (
                    <div key={problem} className="flex gap-4 border-b border-white/[0.1] py-4">
                      <span className="pt-0.5 text-[10px] tracking-[0.2em] text-white/28">0{index + 1}</span>
                      <p className="text-sm leading-6 text-white/55">{problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-24">
              <div className="order-2 lg:order-1">
                <p className="eyebrow">Meet KOVA</p>
                <h2 className="section-title mt-5 max-w-2xl">A clear path from <em>open to stronger.</em></h2>
                <p className="mt-7 max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  Instead of handing you a huge exercise library and asking you
                  to build everything yourself, KOVA gives you a clear training
                  path. Open the app and your next step is ready.
                </p>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/35">
                  KOVA handles the complexity. You focus on showing up, doing
                  the work, and giving simple feedback.
                </p>
              </div>
              <div className="order-1 flex items-center justify-center lg:order-2">
                <div className="liquid-glass w-full max-w-sm rounded-[2rem] p-6 sm:p-8">
                  <div className="flex items-center justify-between border-b border-white/[0.1] pb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Today</p>
                      <p className="mt-2 font-serif text-3xl italic tracking-[-0.05em] text-white/90">Upper body</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-full bg-white text-black"><Play size={14} fill="currentColor" /></span>
                  </div>
                  <div className="space-y-3 pt-5">
                    {["Incline press", "Seated row", "Lateral raise"].map((exercise, index) => (
                      <div key={exercise} className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-white/[0.08] text-[10px] text-white/45">0{index + 1}</span>
                        <span className="text-sm text-white/65">{exercise}</span>
                        <Check className="ml-auto size-4 text-white/35" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-[10px] uppercase tracking-[0.18em] text-white/28">Your next step is always clear</p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <p className="eyebrow">Follow your workout</p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <h2 className="section-title max-w-md">Train, log, rest. <em>Repeat.</em></h2>
              <div>
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  Every session is built around the next useful action. No
                  digging through menus while you are trying to train.
                </p>
                <div className="mt-12 grid gap-3 sm:grid-cols-5">
                  {coachingSteps.map((step) => (
                    <div key={step.number} className="liquid-glass rounded-2xl p-4 sm:min-h-[150px]">
                      <span className="text-[10px] tracking-[0.2em] text-white/30">{step.number}</span>
                      <p className="mt-8 font-serif text-xl italic text-white/85">{step.label}</p>
                      <p className="mt-2 text-xs leading-5 text-white/38">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24">
              <div>
                <p className="eyebrow">See how to do it</p>
                <h2 className="section-title mt-5 max-w-xl">Don&apos;t just read the exercise. <em>See it.</em></h2>
                <p className="mt-7 max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  An exercise name is not always enough. KOVA pairs movements
                  with clear visual demonstrations so you can see the setup,
                  the movement, and what to focus on before your first rep.
                </p>
              </div>
              <div className="liquid-glass relative overflow-hidden rounded-[2rem] p-3">
                <div className="relative flex min-h-[300px] items-end overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-white/[0.13] via-white/[0.04] to-black px-6 pb-6 sm:min-h-[360px] sm:px-8 sm:pb-8">
                  <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white/70">
                    <Play size={25} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Exercise demonstration</p>
                    <p className="mt-2 font-serif text-3xl italic text-white/90">Incline dumbbell press</p>
                    <p className="mt-3 text-xs text-white/40">Setup · Movement · Focus</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="eyebrow">Logging that stays out of your way</p>
                <h2 className="section-title mt-5 max-w-md">Spend your time <em>training, not tapping.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  Recording a set should take seconds, not a separate workflow.
                  KOVA keeps the important actions close: complete the set,
                  enter your weight and reps, share how it felt, and keep going.
                </p>
                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {["Weight", "Reps", "Effort"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/[0.1] bg-white/[0.035] px-5 py-6">
                      <Check className="size-4 text-white/55" />
                      <p className="mt-8 text-sm text-white/65">{item}</p>
                      <p className="mt-1 text-xs text-white/30">Logged in a moment</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
              <div>
                <p className="eyebrow">Coaching that adapts</p>
                <h2 className="section-title mt-5 max-w-2xl">Your workouts shouldn&apos;t stay the same <em>while you change.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  After a workout, KOVA can learn from how it went: the weight
                  you used, the reps you completed, how difficult the set felt,
                  and how recovered you are.
                </p>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/40">
                  That feedback helps shape a better next session. Not magic.
                  Just intelligent guidance that responds to your training.
                </p>
                <p className="mt-10 font-serif text-3xl italic tracking-[-0.04em] text-white/85 sm:text-4xl">You train. KOVA learns. Your next workout gets better.</p>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
              <div>
                <p className="eyebrow">Built for beginners. Powerful for lifters.</p>
                <h2 className="section-title mt-5 max-w-md">Start simple. <em>Keep growing.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  You do not need to know how to train before using KOVA. The app
                  teaches you while you train, with a clear plan and guidance at
                  the moment you need it.
                </p>
                <p className="mt-5 max-w-xl text-base leading-8 text-white/40">
                  As you get stronger, KOVA grows with you. Experienced lifters
                  get structured programming and adaptive coaching without
                  losing the simplicity that makes training easier to follow.
                </p>
                <div className="mt-10 flex flex-wrap gap-2">
                  {["No prior knowledge needed", "Clear guidance", "Adapts as you grow"].map((item) => (
                    <span key={item} className="glass-pill px-4 py-2 text-xs text-white/55">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="eyebrow">Progress</p>
                <h2 className="section-title mt-5 max-w-md">Know that your work <em>is adding up.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  KOVA turns your training history into progress you can
                  understand. Look back and see meaningful improvements without
                  getting buried in numbers.
                </p>
                <div className="mt-10 grid gap-3 md:grid-cols-3">
                  {progressItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="liquid-glass rounded-2xl p-6">
                        <Icon className="size-5 text-white/55" strokeWidth={1.5} />
                        <p className="mt-10 text-sm font-medium text-white/75">{item.label}</p>
                        <p className="mt-2 text-xs leading-5 text-white/35">{item.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        <section className="section-shell border-t border-white/[0.08] px-6 py-32 sm:py-44 lg:px-12">
          <SectionReveal className="mx-auto max-w-4xl text-center">
            <p className="eyebrow">The KOVA philosophy</p>
            <h2 className="mt-6 font-serif text-[clamp(3.2rem,8vw,6.8rem)] leading-[0.88] tracking-[-0.07em] text-white">
              KOVA handles the complexity. <em className="text-white/55">You do the work.</em>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
              You should not need to spend hours researching workouts, build
              every session yourself, or understand every piece of exercise
              science before you can start. Open the app. Know what to do. Train.
              Get better.
            </p>
            <a
              href="/#waitlist"
              className="mt-10 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]"
            >
              Join the waitlist <ArrowUpRight size={15} strokeWidth={1.8} />
            </a>
          </SectionReveal>
        </section>

        <Footer />
      </div>
    </main>
  );
}
