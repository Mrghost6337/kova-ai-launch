import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { SectionReveal } from "./KovaBackground";
import DotField from "./DotField";

export function Waitlist() {
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValid) {
      setError("Please enter a valid email.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await join({ email: trimmedEmail });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="waitlist" className="section-shell relative overflow-hidden px-6 py-28 sm:py-40">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-95">
        <DotField
          dotRadius={1.5}
          dotSpacing={16}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="#ffffff"
          gradientTo="#ffffff"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-48 bg-gradient-to-b from-black via-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-56 bg-gradient-to-t from-black via-black/65 to-transparent" />
      <SectionReveal className="relative z-10 mx-auto max-w-5xl">
        <div className="liquid-glass relative overflow-hidden rounded-[2rem] px-5 py-12 sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.055] blur-[120px]" />
          <div className="relative z-10">
            <div className="mx-auto max-w-xl text-center">
              <p className="eyebrow">KOVA AI · Coming soon to iOS</p>
              <h2 className="section-title mt-5">Be first to <em>train with KOVA.</em></h2>
              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/48">
                Join the waitlist for launch updates and early access.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto mt-9 flex max-w-2xl items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-6 py-4 text-sm text-white/85"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-black">
                    <Check size={12} strokeWidth={2.2} />
                  </span>
                  You&apos;re on the list.
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="mx-auto mt-9 max-w-2xl"
                >
                  <div className="flex flex-col gap-2 rounded-[1.75rem] border border-white/[0.16] bg-black/35 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:rounded-full">
                    <label htmlFor="waitlist-email" className="sr-only">Your email</label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      placeholder="Your email"
                      className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-base text-white outline-none placeholder:text-white/42"
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "waitlist-error" : undefined}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 rounded-full bg-white px-7 text-[15px] font-semibold tracking-[-0.02em] text-black transition-colors hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[158px]"
                    >
                      {isSubmitting ? "Joining…" : "Join Waitlist"}
                    </button>
                  </div>
                  {error && <p id="waitlist-error" className="mt-3 px-4 text-left text-xs text-white/65">{error}</p>}
                </motion.form>
              )}
            </AnimatePresence>

            <p className="relative mt-5 text-center text-[10px] uppercase tracking-[0.14em] text-white/25">No spam. Just KOVA updates.</p>
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
