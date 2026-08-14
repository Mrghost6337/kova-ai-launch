import { SectionReveal } from "./KovaBackground";

const features = [
  ["01", "Adaptive AI training", "Your next workout changes based on your performance and recovery."],
  ["02", "Personalized workouts", "KOVA removes the guesswork from your split, exercises and progression."],
  ["03", "Guided sessions", "Set logging, rest timers and haptic cues keep you focused through every session."],
  ["04", "Progress tracking", "See training volume, sessions, personal records and long-term progress in one place."],
  ["05", "Post-workout feedback", "Tell KOVA how the session felt and let it intelligently adapt what comes next."],
  ["06", "Training history & phases", "Understand where you are in your program and what your next phase holds."],
  ["07", "Apple Health", "Connect your health data directly from your iPhone to give KOVA more context."],
  ["08", "Reminders & sync", "Keep training organized and consistent across your KOVA experience."],
  ["09", "Export & account controls", "Your data stays manageable, accessible and in your hands."],
] as const;

export function Features() {
  return (
    <section id="features" className="section-shell border-t border-white/[0.07] px-6 py-28 sm:py-36">
      <SectionReveal className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow">Built for the way you train</p><h2 className="section-title mt-5 max-w-2xl">Everything behind <em>better training.</em></h2></div><p className="max-w-xs text-sm leading-6 text-white/38 md:pb-1">One adaptive system from your first set to your next personal record.</p></div>
        <div className="mt-16 border-t border-white/[0.1] sm:mt-24">
          {features.map(([index, title, description]) => <article key={index} className="group grid gap-5 border-b border-white/[0.1] py-7 transition-colors hover:bg-white/[0.025] sm:grid-cols-[5rem_1fr_1fr] sm:items-center sm:gap-8 sm:px-4"><span className="text-[10px] tracking-[0.2em] text-white/30">{index}</span><h3 className="font-serif text-3xl tracking-[-0.04em] text-white/88 transition-colors group-hover:text-white sm:text-4xl">{title}</h3><p className="max-w-sm text-sm leading-6 text-white/42">{description}</p></article>)}
        </div>
      </SectionReveal>
    </section>
  );
}
