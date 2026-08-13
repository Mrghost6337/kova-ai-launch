import { Link, useLocation, useNavigate } from "react-router";

const footerLinks = [
  { label: "App", to: "/app" },
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

export function Footer() {
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
    <footer className="border-t border-white/[0.1] px-6 pb-8 pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <Link to="/" className="font-serif text-3xl italic tracking-[-0.06em] text-white">Kova AI</Link>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-4 sm:flex sm:flex-wrap sm:gap-7" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              link.to ? (
                <Link key={link.label} to={link.to} className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white">{link.label}</Link>
              ) : (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => link.href && goToSection(link.href)}
                  className="text-left text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white"
                >
                  {link.label}
                </button>
              )
            ))}
            <a href="mailto:hello@kova.ai?subject=Privacy%20enquiry" className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white">Privacy</a>
            <a href="mailto:hello@kova.ai?subject=Terms%20enquiry" className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white">Terms</a>
            <a href="mailto:hello@kova.ai" className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white">Contact</a>
          </nav>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/[0.08] pt-5 text-[10px] uppercase tracking-[0.14em] text-white/25 sm:flex-row">
          <span>© 2026 Kova AI. All rights reserved.</span>
          <span>Built for the future of work.</span>
        </div>
      </div>
    </footer>
  );
}
