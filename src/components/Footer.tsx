import { Link, useLocation, useNavigate } from "react-router";
import { GitHubMark, XMark } from "./SocialIcons";

const footerLinks = [
  { label: "About", href: "#product" },
  { label: "App", to: "/app" },
  { label: "Pricing", to: "/pricing" },
  { label: "Team", to: "/team" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

export function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const goToSection = (href: string) => {
    if (location.pathname === "/") document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    else navigate(`/${href}`);
  };

  return (
    <footer className="border-t border-white/[0.1] px-6 pb-8 pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div>
            <Link to="/" className="font-serif text-3xl italic tracking-[-0.06em] text-white">
              KOVA AI
            </Link>
            <div className="mt-4 flex items-center gap-1.5">
              <a
                href="https://x.com/CheynsEdward"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KOVA AI on X"
                className="flex size-8 items-center justify-center rounded-full text-white/45 transition-colors hover:text-white"
              >
                <XMark className="size-3.5" />
              </a>
              <a
                href="https://github.com/Mrghost6337/kova-ai-launch"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="KOVA AI on GitHub"
                className="flex size-8 items-center justify-center rounded-full text-white/45 transition-colors hover:text-white"
              >
                <GitHubMark className="size-4" />
              </a>
            </div>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-12 gap-y-4 sm:flex sm:flex-wrap sm:gap-7"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
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
            )}
            <a
              href="mailto:hello@kova.ai"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white"
            >
              Contact
            </a>
          </nav>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/[0.08] pt-5 text-[10px] uppercase tracking-[0.14em] text-white/25 sm:flex-row">
          <span>© 2026 KOVA AI. All rights reserved.</span>
          <span>Built for your next PR.</span>
        </div>
      </div>
    </footer>
  );
}
