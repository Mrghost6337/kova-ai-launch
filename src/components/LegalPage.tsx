import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { KovaBackground } from "./KovaBackground";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Seo } from "./Seo";

type LegalPageProps = {
  title: string;
  description: string;
  path: string;
  updated: string;
  eyebrow?: string;
  children: ReactNode;
};

export function LegalPage({
  title,
  description,
  path,
  updated,
  eyebrow = "Legal",
  children,
}: LegalPageProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <Seo title={`${title} — KOVA AI`} description={description} path={path} />
      <div className="relative z-10">
        <section className="px-6 pb-10 pt-36 lg:px-12 lg:pt-44">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="mt-6 font-serif text-[clamp(2.6rem,7vw,4.8rem)] leading-[0.9] tracking-[-0.06em] text-white">
                {title}
              </h1>
              <p className="mt-5 text-sm text-white/40">
                Last updated {updated}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="legal-prose mt-12"
            >
              {children}
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    </main>
  );
}
