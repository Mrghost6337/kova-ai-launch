import { motion } from "framer-motion";
import { KovaBackground } from "@/components/KovaBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { XMark } from "@/components/SocialIcons";

const team = [
  {
    name: "Edward Cheyns",
    role: "CEO",
    age: "15 y/o",
    x: "https://x.com/CheynsEdward",
    initial: "E",
    blurb: "Sets the direction for KOVA and keeps the product focused on the lifter.",
  },
  {
    name: "Bavo",
    role: "Co-CEO",
    age: "16 y/o",
    x: "https://x.com/BavoClercq24837",
    initial: "B",
    blurb: "Builds alongside Edward to turn KOVA into a coach that actually adapts.",
  },
];

export default function Team() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-black text-white">
      <KovaBackground />
      <Navbar />
      <Seo
        title="Team — KOVA AI"
        description="Meet the team building KOVA AI — Edward Cheyns (CEO) and Bavo (Co-CEO)."
        path="/team"
      />
      <div className="relative z-10">
        <section className="px-6 pb-10 pt-36 lg:px-12 lg:pt-44">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <p className="eyebrow">The team</p>
              <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.2rem)] leading-[0.88] tracking-[-0.07em] text-white">
                Built by lifters. <em className="text-white/55">For lifters.</em>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-white/50">
                KOVA is a small team with a simple goal: take the guesswork out
                of training and give every lifter a coach that keeps learning.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-5 md:grid-cols-2">
              {team.map((member, index) => (
                <motion.article
                  key={member.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.65, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="liquid-glass group rounded-[1.6rem] p-8 sm:p-10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-16 items-center justify-center rounded-full bg-white text-2xl font-serif italic text-black ring-1 ring-white/20">
                      {member.initial}
                    </div>
                    <a
                      href={member.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on X`}
                      className="glass-pill flex size-10 items-center justify-center text-white/70 transition-colors hover:text-white"
                    >
                      <XMark className="size-4" />
                    </a>
                  </div>
                  <h2 className="mt-8 font-serif text-3xl italic tracking-[-0.05em] text-white/90">
                    {member.name}
                  </h2>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                    {member.role} · {member.age}
                  </p>
                  <p className="mt-5 text-sm leading-6 text-white/45">{member.blurb}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </main>
  );
}
