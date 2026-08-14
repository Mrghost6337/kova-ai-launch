import { LockKeyhole } from "lucide-react";
import { SectionReveal } from "./KovaBackground";

const principles = [
  { title: "Your training stays yours", description: "KOVA is designed to keep your workout history, feedback and progress manageable and accessible to you." },
  { title: "Health data with intention", description: "Apple Health connects your iPhone data directly to your experience, with controls designed around your choices." },
  { title: "Clear account controls", description: "Export your data, manage your account and make informed choices about the training context KOVA uses." },
];

export function Security() { return <section id="security" className="section-shell border-y border-white/[0.07] px-6 py-28 sm:py-36"><SectionReveal className="mx-auto max-w-6xl"><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24"><div><p className="eyebrow">Designed with care</p><h2 className="section-title mt-5 max-w-lg">Training you can <em>trust.</em></h2><p className="mt-7 max-w-sm text-sm leading-7 text-white/45 sm:text-base">Privacy and control are part of the KOVA experience from the start.</p></div><div className="liquid-glass rounded-[1.6rem] p-6 sm:p-8"><div className="flex items-center justify-between border-b border-white/[0.1] pb-5"><span className="text-[10px] uppercase tracking-[0.2em] text-white/38">Our principles</span><LockKeyhole size={16} strokeWidth={1.2} className="text-white/45" /></div><div>{principles.map((principle, index) => <div key={principle.title} className={`py-6 ${index < principles.length - 1 ? "border-b border-white/[0.08]" : ""}`}><h3 className="text-sm font-medium text-white/85">{principle.title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-white/40">{principle.description}</p></div>)}</div></div></div></SectionReveal></section>; }
