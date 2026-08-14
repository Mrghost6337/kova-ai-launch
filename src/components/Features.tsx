import { SectionReveal } from "./KovaBackground";

const features = [
  ["01", "Adaptive AI training", "Your next workout changes as you do."],
  ["02", "Personalized workouts", "No need to plan your split or choose every exercise."],
  ["03", "Guided sessions", "Log sets, follow rest timers and stay focused."],
  ["04", "Progress tracking", "See your sessions, volume, PRs and progress in one place."],
  ["05", "Post-workout feedback", "Share how it felt and KOVA adjusts your next workout."],
  ["06", "Training history & phases", "See where you are now and what comes next."],
  ["07", "Apple Health", "Connect Apple Health on your iPhone."],
  ["08", "Reminders & sync", "Keep your training on track with simple reminders and sync."],
  ["09", "Export & account controls", "Export your data and manage your account with ease."],
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
