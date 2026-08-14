import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionReveal } from "./KovaBackground";

const questions = [
  ["What is KOVA AI?", "KOVA is a strength coach for intermediate lifters. It plans workouts, guides each session and learns from your results."],
  ["How does KOVA adapt my training?", "KOVA uses your results and feedback to plan what comes next."],
  ["Who is KOVA for?", "KOVA is for lifters who want a personal plan without writing every workout."],
  ["What is the difference between PRO and ULTRA?", "PRO includes the full KOVA training experience. ULTRA is the highest level of coaching for serious lifters."],
  ["Will KOVA work with Apple Health?", "Yes. KOVA connects with Apple Health on your iPhone."],
  ["When will KOVA be available?", "KOVA is coming to iOS soon. Join the waitlist for launch updates."],
];

export function FAQ() { const [openIndex, setOpenIndex] = useState<number | null>(0); return <section id="about" className="section-shell border-t border-white/[0.07] px-6 py-28 sm:py-36"><SectionReveal className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><div><p className="eyebrow">Good to know</p><h2 className="section-title mt-5">Questions, <em>answered.</em></h2></div><div className="border-t border-white/[0.1]">{questions.map(([question, answer], index) => { const isOpen = openIndex === index; return <div key={question} className="border-b border-white/[0.1]"><button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 py-6 text-left"><span className="text-sm font-medium text-white/78 transition-colors hover:text-white">{question}</span><ChevronDown size={17} strokeWidth={1.3} className={`shrink-0 text-white/45 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden"><p className="max-w-xl pb-6 text-sm leading-7 text-white/42">{answer}</p></motion.div>}</AnimatePresence></div>; })}</div></SectionReveal></section>; }
