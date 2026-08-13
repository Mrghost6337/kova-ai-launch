import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { FormEvent, useState } from "react";
import { SectionReveal } from "./KovaBackground";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isValid) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="section-shell px-6 py-28 sm:py-40">
      <SectionReveal className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-white/[0.035] px-6 py-16 text-center sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.055] blur-[100px]" />
          <div className="relative z-10">
            <p className="eyebrow">Early access</p>
            <h2 className="section-title mx-auto mt-5 max-w-2xl">Be first to experience <em>Kova AI.</em></h2>
            <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-white/45">Kova AI is coming soon. Join the waitlist and be notified when early access opens.</p>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.07] px-5 py-4 text-sm text-white/80">
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-black"><Check size={12} strokeWidth={2.2} /></span>
                  You&apos;re on the list.
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md">
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.15] bg-black/35 p-2 sm:flex-row sm:rounded-full">
                    <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                    <input id="waitlist-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="Enter your email" className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/30" aria-invalid={Boolean(error)} aria-describedby={error ? "waitlist-error" : undefined} />
                    <button type="submit" className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.1em] text-black transition-transform hover:scale-[1.02]">
                      Join Waitlist
                      <ArrowUpRight size={14} strokeWidth={1.7} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                  {error && <p id="waitlist-error" className="mt-3 text-left text-xs text-white/60">{error}</p>}
                </motion.form>
              )}
            </AnimatePresence>
            <p className="relative mt-5 text-[10px] uppercase tracking-[0.15em] text-white/25">No spam. Just launch updates.</p>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
