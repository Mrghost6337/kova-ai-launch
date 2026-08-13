import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionReveal } from "./KovaBackground";

const questions = [
  ["What is Kova AI?", "Kova AI is an iPhone app that puts powerful AI tools in one place — helping you automate repetitive work, move faster and get more from AI."],
  ["When is Kova AI available?", "Kova AI is preparing for launch on iOS. Join the waitlist to be notified the moment early access opens."],
  ["Who is Kova AI for?", "Kova AI is designed for individuals, creators, professionals and teams who want to use AI more effectively from their phone."],
  ["Is there a free plan?", "Yes. Kova AI offers a free plan, and you can upgrade to Pro for advanced features, higher limits and automation."],
  ["Do I need an account?", "You can explore Kova AI without one, but signing in keeps your purchases and preferences synced."],
  ["Is my data secure?", "Kova AI is designed with privacy and security in mind. We only make specific security claims that are technically implemented and verified."],
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="about" className="section-shell border-t border-white/[0.07] px-6 py-28 sm:py-36">
      <SectionReveal className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
        <div>
          <p className="eyebrow">Good to know</p>
          <h2 className="section-title mt-5">Questions, <em>answered.</em></h2>
        </div>
        <div className="border-t border-white/[0.1]">
          {questions.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <div key={question} className="border-b border-white/[0.1]">
                <button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 py-6 text-left">
                  <span className="text-sm font-medium text-white/78 transition-colors hover:text-white">{question}</span>
                  <ChevronDown size={17} strokeWidth={1.3} className={`shrink-0 text-white/45 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
                      <p className="max-w-xl pb-6 text-sm leading-7 text-white/42">{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </SectionReveal>
    </section>
  );
}
