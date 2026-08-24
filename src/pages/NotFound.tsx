import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-36">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow">Page not found</p>
          <h1 className="mt-6 font-serif text-[clamp(4.5rem,14vw,10rem)] leading-[0.85] tracking-[-0.07em] text-white">
            404
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-7 text-white/50">
            This page doesn&apos;t exist — but your next workout is still right
            where you left it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="group inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.03]"
            >
              <ArrowLeft size={15} strokeWidth={1.8} className="transition-transform group-hover:-translate-x-0.5" />
              Back to KOVA AI
            </Link>
            <Link
              to="/about"
              className="glass-pill inline-flex h-12 items-center px-6 text-xs font-medium uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
            >
              Learn about KOVA
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
