import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Dumbbell,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { KovaBackground, SectionReveal } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

const frictionPoints = [
  {
    number: "01",
    title: "What do I do today?",
    text: "No plan, too many choices, and a blank workout waiting to be built.",
  },
  {
    number: "02",
    title: "Am I doing it right?",
    text: "An exercise name cannot show you how to set up, move, or focus.",
  },
  {
    number: "03",
    title: "Is this working?",
    text: "Without a clear history, it is hard to see whether your effort is adding up.",
  },
];

const systemPillars = [
  {
    number: "01",
    title: "Prescribe",
    label: "A plan that is ready",
    text: "KOVA gives you a clear session built around your goals, your level, and where you are today.",
  },
  {
    number: "02",
    title: "Guide",
    label: "Know how to move",
    text: "Visual exercise guidance makes unfamiliar movements easier to understand before the first rep.",
  },
  {
    number: "03",
    title: "Capture",
    label: "Log without breaking rhythm",
    text: "Weight, reps, effort, and completion stay one quick action away while you train.",
  },
  {
    number: "04",
    title: "Adapt",
    label: "A better next session",
    text: "KOVA learns from what happened and uses your feedback to shape what comes next.",
  },
];

const sessionSteps = [
  { number: "01", title: "Open KOVA", text: "Your next workout is waiting." },
  { number: "02", title: "See the movement", text: "A clear demonstration removes the guesswork." },
  { number: "03", title: "Complete the set", text: "Train with one simple next step." },
  { number: "04", title: "Log in seconds", text: "Capture the useful details and keep moving." },
  { number: "05", title: "Rest and repeat", text: "KOVA keeps the session flowing." },
];

const progressSignals = [
  { icon: TrendingUp, title: "Strength", text: "See exercises and weights move forward." },
  { icon: Dumbbell, title: "Consistency", text: "Notice the habit you are building." },
  { icon: Timer, title: "Performance", text: "Understand how each session felt." },
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
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-36 sm:pb-32 sm:pt-44 lg:px-12">
          <div className="pointer-events-none absolute left-1/2 top-20 h-[520px] w-[min(90vw,1000px)] -translate-x-1/2 rounded-full bg-white/[0.035] blur-[130px]" />
          <div className="relative mx-auto grid min-h-[650px] max-w-6xl items-center gap-16 lg:grid-cols-[1fr_0.85fr] lg:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <p className="eyebrow">About KOVA AI · Strength & hypertrophy coaching</p>
              <h1 className="mt-7 max-w-4xl font-serif text-[clamp(4rem,10vw,8.8rem)] leading-[0.83] tracking-[-0.075em] text-white">
                Your training. <em className="text-white/55">Smarter.</em>
              </h1>
              <p className="mt-9 max-w-2xl text-lg leading-8 text-white/55 sm:text-xl">
                A premium coach that tells you what to do, shows you how to do
                it, and gets better as you get stronger.
              </p>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/35">
                Simple enough to start today. Smart enough to grow with you.
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
                  Why KOVA exists <ArrowDown size={14} strokeWidth={1.5} />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[390px] lg:mx-0 lg:ml-auto"
            >
              <div className="absolute -inset-8 rounded-[3rem] bg-white/[0.035] blur-3xl" />
              <div className="liquid-glass relative rounded-[2.3rem] border-white/[0.16] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
                <div className="overflow-hidden rounded-[1.8rem] bg-[#111112] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">KOVA · Today</p>
                      <p className="mt-2 font-serif text-3xl italic tracking-[-0.05em] text-white/90">Upper body</p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-black">
                      <Play size={14} fill="currentColor" />
                    </div>
                  </div>
                  <div className="mt-7 rounded-[1.4rem] border border-white/[0.1] bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/35">Next exercise</p>
                        <p className="mt-2 text-sm font-medium text-white/80">Incline dumbbell press</p>
                      </div>
                      <span className="text-[10px] text-white/35">Set 2 / 3</span>
                    </div>
                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.1]">
                      <div className="h-full w-2/3 rounded-full bg-white/75" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-white/38">
                      <Sparkles size={12} /> Keep the movement controlled.
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/[0.045] p-4">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">Last set</p>
                      <p className="mt-3 text-lg text-white/75">22.5 kg</p>
                      <p className="mt-1 text-[10px] text-white/32">10 reps · felt good</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.045] p-4">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">Up next</p>
                      <p className="mt-3 text-lg text-white/75">Rest</p>
                      <p className="mt-1 text-[10px] text-white/32">01:24 remaining</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="relative mt-5 text-center text-[9px] uppercase tracking-[0.24em] text-white/25">The next step is always clear</p>
            </motion.div>
          </div>
        </section>

        {/* Problem */}
        <section id="the-problem" className="section-shell border-t border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="eyebrow">The problem</p>
                <h2 className="section-title mt-5 max-w-md">The gym is hard enough <em>without the guesswork.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/52 sm:text-lg">
                  Training should challenge your body, not your ability to plan.
                  Yet most people are asked to choose the exercises, learn the
                  technique, build the workout, and track the result all by
                  themselves.
                </p>
                <div className="mt-10 grid gap-3 md:grid-cols-3">
                  {frictionPoints.map((point) => (
                    <article key={point.number} className="liquid-glass rounded-[1.5rem] p-6 sm:p-7">
                      <span className="text-[10px] tracking-[0.2em] text-white/30">{point.number}</span>
                      <h3 className="mt-12 font-serif text-2xl italic tracking-[-0.04em] text-white/85">{point.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/40">{point.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Meet KOVA / four pillars */}
        <section id="how-it-works" className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="eyebrow">Meet KOVA</p>
              <h2 className="section-title mt-5">The intelligence is in the <em>whole experience.</em></h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/48 sm:text-lg">
                KOVA is not a chatbot and it is not another place to store old
                workouts. It combines programming, guidance, education, fast
                logging, and progress into one calm path through the gym.
              </p>
            </div>
            <div className="mt-16 grid gap-3 sm:grid-cols-2">
              {systemPillars.map((pillar, index) => (
                <motion.article
                  key={pillar.number}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="liquid-glass group min-h-[250px] rounded-[1.7rem] p-7 transition-colors hover:border-white/[0.2] sm:p-9"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] tracking-[0.2em] text-white/30">{pillar.number}</span>
                    <ArrowUpRight size={16} className="text-white/25 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white/70" />
                  </div>
                  <div className="mt-14 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/38">{pillar.label}</p>
                      <h3 className="mt-3 font-serif text-3xl italic tracking-[-0.05em] text-white/90">{pillar.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/42">{pillar.text}</p>
                </motion.article>
              ))}
            </div>
          </SectionReveal>
        </section>

        {/* Session flow */}
        <section className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
              <div>
                <p className="eyebrow">Inside a KOVA session</p>
                <h2 className="section-title mt-5 max-w-md">A workout that keeps you <em>in the moment.</em></h2>
                <p className="mt-7 max-w-md text-base leading-8 text-white/45">
                  The app stays quiet until you need it, then gives you one clear
                  action. No maze of menus. No interruption to your rhythm.
                </p>
              </div>
              <div className="relative lg:pt-8">
                <div className="absolute bottom-8 left-[15px] top-8 w-px bg-gradient-to-b from-white/5 via-white/25 to-white/5 sm:left-[19px]" />
                <div className="space-y-3">
                  {sessionSteps.map((step, index) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: 15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                      className="relative flex items-center gap-5 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03] sm:gap-7 sm:p-4"
                    >
                      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black text-[9px] tracking-[0.1em] text-white/55 sm:size-10">{step.number}</span>
                      <div className="flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                        <h3 className="font-serif text-2xl italic tracking-[-0.04em] text-white/85">{step.title}</h3>
                        <p className="mt-1 text-sm text-white/35 sm:mt-0">{step.text}</p>
                      </div>
                      {index < sessionSteps.length - 1 && <ArrowRight className="hidden size-4 text-white/20 sm:block" />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Visual guidance */}
        <section id="guidance" className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-24">
              <div className="order-2 lg:order-1">
                <p className="eyebrow">Exercise education</p>
                <h2 className="section-title mt-5 max-w-xl">Don&apos;t just read the exercise. <em>See it.</em></h2>
                <p className="mt-7 max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  Names are useful. A clear demonstration is better. KOVA is
                  designed to show the setup, the movement, and the focus before
                  you start — especially when the exercise is new.
                </p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {["How to set up", "What the movement looks like", "What to focus on"].map((item) => (
                    <span key={item} className="glass-pill px-4 py-2 text-xs text-white/52">{item}</span>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="liquid-glass relative rounded-[2rem] p-3">
                  <div className="relative min-h-[390px] overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-white/[0.14] via-white/[0.045] to-black p-6 sm:p-8">
                    <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:18px_18px]" />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Exercise demonstration</p>
                        <p className="mt-2 font-serif text-3xl italic text-white/90">Goblet squat</p>
                      </div>
                      <span className="rounded-full border border-white/15 px-3 py-1 text-[9px] uppercase tracking-[0.15em] text-white/38">Watch</span>
                    </div>
                    <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] shadow-[0_0_60px_rgba(255,255,255,0.08)]">
                      <Play size={26} fill="currentColor" className="text-white/80" />
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/[0.1] bg-black/35 px-4 py-3 backdrop-blur-sm sm:bottom-8 sm:left-8 sm:right-8">
                      <span className="text-[10px] text-white/45">Chest tall · knees follow toes</span>
                      <ArrowRight size={14} className="text-white/35" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Fast logging */}
        <section id="logging" className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
              <div>
                <p className="eyebrow">Fast logging</p>
                <h2 className="section-title mt-5 max-w-md">Spend your time <em>training, not tapping.</em></h2>
                <p className="mt-7 max-w-md text-base leading-8 text-white/48 sm:text-lg">
                  Your workout log should support the session, not become the
                  session. KOVA keeps the essentials close and the interaction
                  short.
                </p>
              </div>
              <div className="liquid-glass rounded-[2rem] p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-white/[0.1] pb-5">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Set 2 of 3</p>
                    <p className="mt-2 text-base text-white/75">Goblet squat</p>
                  </div>
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10px] text-white/45">00:42 rest</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    ["Weight", "24 kg"],
                    ["Reps", "10"],
                    ["Effort", "Good"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 sm:p-5">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">{label}</p>
                      <p className="mt-5 text-base text-white/78 sm:text-lg">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 text-black">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Set complete</span>
                  <Check size={16} strokeWidth={2.5} />
                </div>
                <p className="mt-5 text-center text-[9px] uppercase tracking-[0.2em] text-white/25">Train → Log → Rest → Next set</p>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Adaptation */}
        <section id="adaptation" className="section-shell px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-24">
              <div>
                <p className="eyebrow">Adaptive coaching</p>
                <h2 className="section-title mt-5 max-w-2xl">Your workouts shouldn&apos;t stay the same <em>while you change.</em></h2>
                <p className="mt-7 max-w-xl text-base leading-8 text-white/50 sm:text-lg">
                  After each session, KOVA can learn from your performance, the
                  weight and reps you completed, how difficult it felt, and how
                  recovered you are.
                </p>
              </div>
              <div className="relative lg:pt-12">
                <div className="liquid-glass rounded-[2rem] p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-black"><Sparkles size={16} /></div>
                    <div>
                      <p className="text-sm text-white/75">KOVA learned from your session</p>
                      <p className="mt-1 text-xs text-white/32">Your next workout is ready to adapt</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-3">
                    {["Performance logged", "Effort understood", "Recovery considered"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[0.045] px-4 py-3">
                        <Check className="size-4 text-white/55" />
                        <span className="text-sm text-white/55">{item}</span>
                        <span className="ml-auto text-[10px] text-white/25">0{index + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 flex items-center gap-3 text-white/70">
                    <RotateCcw size={15} className="text-white/45" />
                    <span className="font-serif text-2xl italic">You train. KOVA learns.</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Audience + progress */}
        <section className="section-shell border-y border-white/[0.08] px-6 py-28 sm:py-36 lg:px-12">
          <SectionReveal className="mx-auto max-w-6xl">
            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-[1.8rem] border border-white/[0.1] bg-white/[0.035] p-7 sm:p-10">
                <p className="eyebrow">Starting out</p>
                <h2 className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.06em] text-white/90 sm:text-5xl">You don&apos;t need to know how to train <em className="text-white/50">before KOVA.</em></h2>
                <p className="mt-7 max-w-md text-sm leading-7 text-white/42">KOVA gives you the next exercise, shows you the movement, and teaches you through the session. Start with the plan. Learn by doing.</p>
              </article>
              <article className="liquid-glass rounded-[1.8rem] p-7 sm:p-10">
                <p className="eyebrow">Keep progressing</p>
                <h2 className="mt-5 font-serif text-4xl leading-[0.95] tracking-[-0.06em] text-white/90 sm:text-5xl">Enough structure to <em className="text-white/50">keep up with you.</em></h2>
                <p className="mt-7 max-w-md text-sm leading-7 text-white/42">Experienced lifters get a more structured way to train, track, and adjust — without losing the simple flow that keeps a workout moving.</p>
              </article>
            </div>

            <div id="progress" className="mt-28 grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
              <div>
                <p className="eyebrow">Progress you can understand</p>
                <h2 className="section-title mt-5 max-w-md">Know that your work <em>is adding up.</em></h2>
              </div>
              <div className="lg:pt-16">
                <p className="max-w-xl text-base leading-8 text-white/48 sm:text-lg">
                  Your history should make progress feel visible, not turn into a
                  spreadsheet. KOVA brings the useful signals forward and leaves
                  the noise behind.
                </p>
                <div className="mt-10 grid gap-3 md:grid-cols-3">
                  {progressSignals.map((signal) => {
                    const Icon = signal.icon;
                    return (
                      <div key={signal.title} className="liquid-glass rounded-2xl p-6">
                        <Icon className="size-5 text-white/55" strokeWidth={1.5} />
                        <p className="mt-10 text-sm font-medium text-white/75">{signal.title}</p>
                        <p className="mt-2 text-xs leading-5 text-white/35">{signal.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionReveal>
        </section>

        {/* Philosophy */}
        <section className="section-shell px-6 py-32 sm:py-48 lg:px-12">
          <SectionReveal className="mx-auto max-w-4xl text-center">
            <p className="eyebrow">The KOVA philosophy</p>
            <h2 className="mt-6 font-serif text-[clamp(3.2rem,8vw,6.8rem)] leading-[0.86] tracking-[-0.07em] text-white">
              Simple enough to start today. <em className="text-white/55">Smart enough to grow with you.</em>
            </h2>
            <p className="mx-auto mt-9 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
              You should not need to spend hours researching workouts, build
              every session yourself, or understand every piece of exercise
              science before you can begin. Open KOVA. Know what to do. Train.
              Get better.
            </p>
            <p className="mt-8 font-serif text-3xl italic tracking-[-0.04em] text-white/80 sm:text-4xl">KOVA handles the complexity. You do the work.</p>
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
