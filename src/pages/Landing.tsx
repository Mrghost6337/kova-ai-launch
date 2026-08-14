import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductIntro } from "@/components/ProductIntro";
import { Waitlist } from "@/components/Waitlist";

export default function Landing() {
  return (
    <main id="top" className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <div className="relative z-10">
        <Hero />
        <ProductIntro />
        <Waitlist />
      </div>
    </main>
  );
}
