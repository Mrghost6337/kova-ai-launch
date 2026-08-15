import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "convex/react";
import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import DotField from "./DotField";
import { SectionReveal } from "./KovaBackground";

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
    <section
      id="waitlist"
      className="section-shell relative flex min-h-[520px] items-center justify-center overflow-hidden px-6 py-32 sm:min-h-[600px] sm:py-40"
    >
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-40 bg-gradient-to-b from-black via-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-44 bg-gradient-to-t from-black via-black/55 to-transparent" />

      <SectionReveal className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-full border border-white/20 bg-black/55 px-6 py-4 text-sm text-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-black">
                <Check size={12} strokeWidth={2.2} />
              </span>
              You&apos;re on the list.
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="mx-auto max-w-xl"
            >
              <div className="flex flex-col gap-2 rounded-[1.8rem] border border-white/20 bg-black/55 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors focus-within:border-white/35 sm:flex-row sm:items-center sm:rounded-full">
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
                  className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-base text-white outline-none placeholder:text-white/45"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "waitlist-error" : undefined}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 rounded-full bg-white px-7 text-[15px] font-semibold tracking-[-0.02em] text-black transition-all hover:bg-white/85 hover:shadow-[0_0_24px_rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[158px]"
                >
                  {isSubmitting ? "Joining…" : "Join Waitlist"}
                </button>
              </div>
              {error && <p id="waitlist-error" className="mt-3 px-4 text-center text-xs text-white/70">{error}</p>}
            </motion.form>
          )}
        </AnimatePresence>
        <p className="mt-5 text-center text-[10px] uppercase tracking-[0.16em] text-white/40">No spam. Just KOVA updates.</p>
      </SectionReveal>
    </section>
  );
}
