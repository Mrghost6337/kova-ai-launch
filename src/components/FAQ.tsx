import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionReveal } from "./KovaBackground";

const questions = [
  ["What is KOVA AI?", "KOVA is an adaptive strength and hypertrophy coach. It tells you what to do, shows you how to do it, and adjusts your plan as you get stronger."],
  ["Do I need training experience to use KOVA?", "No. KOVA builds your workout and shows you every exercise visually, so you can walk into the gym with zero experience and know exactly what to do."],
  ["How does KOVA adapt my training?", "After each session, KOVA learns from your performance, how hard sets felt, and your recovery. Your next workout is built around what it learned."],
  ["Is logging my workout complicated?", "The opposite. Recording a set takes seconds — weight, reps and effort are one quick action away, so you spend your time training instead of tapping."],
  ["I'm an experienced lifter. Is KOVA still for me?", "Yes. Structured programming, volume tracking and adaptive coaching give experienced lifters a smarter way to train — without giving up the simple flow."],
  ["Will KOVA work with Apple Health?", "Yes. KOVA connects with Apple Health on your iPhone."],
  ["When will KOVA be available?", "KOVA is coming to iOS soon. Join the waitlist for launch updates."],
];

export function FAQ() { const [openIndex, setOpenIndex] = useState<number | null>(0); return <section id="faq" className="section-shell border-t border-white/[0.07] px-6 py-28 sm:py-36"><SectionReveal className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><div><p className="eyebrow">Good to know</p><h2 className="section-title mt-5">Questions, <em>answered.</em></h2></div><div className="border-t border-white/[0.1]">{questions.map(([question, answer], index) => { const isOpen = openIndex === index; return <div key={question} className="border-b border-white/[0.1]"><button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 py-6 text-left"><span className="text-sm font-medium text-white/78 transition-colors hover:text-white">{question}</span><ChevronDown size={17} strokeWidth={1.3} className={`shrink-0 text-white/45 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden"><p className="max-w-xl pb-6 text-sm leading-7 text-white/42">{answer}</p></motion.div>}</AnimatePresence></div>; })}</div></SectionReveal></section>; }
