import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Pricing } from "@/components/Pricing";
import { Seo } from "@/components/Seo";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <Seo
        title="Pricing — KOVA AI"
        description="Simple monthly and annual plans for your adaptive strength coach. Cancel anytime."
        path="/pricing"
      />
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <section className="px-6 pb-8 pt-36 text-center lg:px-12 lg:pt-44">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl"
          >
            <p className="eyebrow">Pricing</p>
            <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.2rem)] leading-[0.88] tracking-[-0.07em] text-white">
              Simple plans. <em className="text-white/55">Serious coaching.</em>
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-white/50">
              Choose monthly or annual, pick your level, and start your adaptive
              training. Cancel anytime.
            </p>
          </motion.div>
        </section>

        <Pricing />

        <Footer />
      </div>
    </main>
  );
}
