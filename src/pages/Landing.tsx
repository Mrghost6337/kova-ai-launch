import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductIntro } from "@/components/ProductIntro";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Security } from "@/components/Security";
import { Pricing } from "@/components/Pricing";
import { Waitlist } from "@/components/Waitlist";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Landing() {
  return (
    <main id="top" className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <Hero />
        <ProductIntro />
        <Features />
        <HowItWorks />
        <Security />
        <Pricing />
        <Waitlist />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}
