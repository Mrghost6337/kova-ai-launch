import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { KovaLogo } from "./KovaLogo";

type NavLink = { label: string; href?: string; to?: string };

const links: NavLink[] = [
  { label: "About", href: "#product" },
  { label: "Pricing", to: "/app#plans" },
  { label: "App", to: "/app" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = (href: string) => {
    if (location.pathname === "/") {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${href}`);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8"
    >
      <nav className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full border-white/[0.14] bg-white/[0.055] px-3.5 py-2.5 shadow-[0_16px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.03] sm:px-5 sm:py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-70"
          aria-label="Back to home"
        >
          <KovaLogo className="size-8 shrink-0 rounded-[23%] ring-1 ring-white/15" />
          <span className="font-serif text-[1.45rem] italic tracking-[-0.06em] sm:text-[1.55rem]">
            KOVA AI
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => link.to ? navigate(link.to) : goToSection(link.href ?? "#product")}
              className="rounded-full px-3 py-2 text-[12px] font-medium tracking-[-0.01em] text-white/62 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToSection("#waitlist")}
          className="hidden rounded-full bg-white px-4 py-2 text-[12px] font-semibold tracking-[-0.01em] text-black transition-transform hover:scale-[1.03] sm:block"
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
            className="liquid-glass mx-auto mt-2 max-w-5xl rounded-3xl border-white/[0.14] bg-white/[0.055] p-3 shadow-[0_16px_50px_rgba(0,0,0,0.45)] md:hidden"
          >
            {links.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (link.to) navigate(link.to);
                  else goToSection(link.href ?? "#product");
                }}
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                goToSection("#waitlist");
              }}
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
            >
              Join Waitlist
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
