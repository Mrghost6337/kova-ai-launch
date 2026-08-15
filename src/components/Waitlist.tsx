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
      className="section-shell relative flex min-h-[640px] items-center justify-center overflow-hidden px-5 py-36 sm:min-h-[720px] sm:px-8 sm:py-44"
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.62]">
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

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_8%,rgba(0,0,0,0.14)_48%,rgba(0,0,0,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-52 bg-gradient-to-b from-black via-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-56 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-[min(76vw,620px)] w-[min(76vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.055]"
        animate={{ rotate: [0, 7, -4, 0], scale: [1, 1.025, 0.99, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-[2] h-[min(48vw,390px)] w-[min(48vw,390px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.045]"
        animate={{ rotate: [0, -10, 5, 0], scale: [1, 0.98, 1.03, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <SectionReveal className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-full border border-white/25 bg-black/65 px-6 py-4 text-sm text-white shadow-[0_0_60px_rgba(255,255,255,0.08),0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
              aria-live="polite"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-black">
                <Check size={12} strokeWidth={2.4} />
              </span>
              You&apos;re on the list.
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.012 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubmit}
              className="group relative mx-auto max-w-xl"
            >
              <div className="pointer-events-none absolute -inset-3 rounded-full bg-white/[0.07] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100 group-focus-within:opacity-100" />
              <div className="relative flex flex-col gap-2 rounded-[1.9rem] border border-white/25 bg-black/60 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[border-color,box-shadow] duration-500 group-focus-within:border-white/45 group-focus-within:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_55px_rgba(255,255,255,0.1),0_20px_80px_rgba(0,0,0,0.55)] sm:flex-row sm:items-center sm:rounded-full">
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
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
                  className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-base tracking-[-0.01em] text-white outline-none placeholder:text-white/45 sm:h-14 sm:px-6"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "waitlist-error" : undefined}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative h-12 overflow-hidden rounded-full bg-white px-7 text-[15px] font-semibold tracking-[-0.02em] text-black transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_28px_rgba(255,255,255,0.24)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:min-w-[168px]"
                >
                  <span className="relative z-10">{isSubmitting ? "Joining…" : "Join Waitlist"}</span>
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-black/10 opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100" />
                </button>
              </div>
              {error && (
                <p id="waitlist-error" className="mt-4 text-center text-xs text-white/75">
                  {error}
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="mt-6 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45"
        >
          <span className="size-1 rounded-full bg-white/65 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          No spam. Just KOVA updates.
        </motion.p>
      </SectionReveal>
    </section>
  );
}
