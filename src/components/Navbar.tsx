import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

function scrollToSection(href: string, onNavigate?: () => void) {
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  onNavigate?.();
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8"
    >
      <nav className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-serif text-[1.45rem] italic tracking-[-0.06em] text-white transition-opacity hover:opacity-70"
          aria-label="Back to top"
        >
          Kova AI
        </button>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollToSection(link.href)}
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/48 transition-colors hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollToSection("#waitlist")}
          className="hidden rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-black transition-transform hover:scale-[1.03] sm:block"
        >
          Join Waitlist
        </button>

        <button
          type="button"
          className="glass-pill flex size-9 items-center justify-center text-white md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="liquid-glass mx-auto mt-2 max-w-6xl rounded-3xl p-3 md:hidden"
          >
            {links.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href, () => setIsOpen(false))}
                className="block w-full rounded-2xl px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.14em] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollToSection("#waitlist", () => setIsOpen(false))}
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black"
            >
              Join Waitlist
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
