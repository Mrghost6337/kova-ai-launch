import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Check, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function CheckoutSuccess() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-lg text-center">
          <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-black">
            <Check size={22} strokeWidth={2} />
          </motion.span>
          <p className="eyebrow mt-8">Purchase complete</p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">You&apos;re all set.</h1>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-white/50">
            Thank you for choosing Kova AI. Your plan is being activated — sign
            in to see it on your account.
          </p>
          <Link to="/dashboard" className="group mt-9 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]">
            Open your dashboard
            <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
