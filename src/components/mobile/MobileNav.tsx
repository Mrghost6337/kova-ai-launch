import { LiquidGlass, type LiquidGlassHandle } from "liquid-glass-web-react";
import { Activity, CalendarDays, Home, UserRound, Utensils } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Plan", to: "/dashboard/plan", icon: CalendarDays },
  { label: "Food", to: "/dashboard/food", icon: Utensils },
  { label: "Progress", to: "/dashboard/progress", icon: Activity },
  { label: "Me", to: "/dashboard/profile", icon: UserRound },
] as const;

function activeTabIndex(pathname: string): number {
  return tabs.findIndex((tab) =>
    tab.to === "/dashboard" ? pathname === "/dashboard" : pathname === tab.to || pathname.startsWith(`${tab.to}/`),
  );
}

const LENS_Y = 0.36;

/**
 * Floating liquid-glass dock. The active tab sits under a real refraction
 * lens (SVG feDisplacementMap from liquid-glass-web-react): a circular glass
 * orb that bends the pixels under it, with an amber glow tracking behind.
 */
export function MobileNav() {
  const { pathname } = useLocation();
  const index = activeTabIndex(pathname);
  const lensRef = useRef<LiquidGlassHandle>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const posRef = useRef<number | null>(null);

  useEffect(() => {
    if (index < 0) return;
    const target = (index + 0.5) / tabs.length;
    const place = (x: number) => {
      posRef.current = x;
      lensRef.current?.setPosition(x, LENS_Y);
      if (glowRef.current) {
        glowRef.current.style.left = `${x * 100}%`;
        glowRef.current.style.top = `${LENS_Y * 100}%`;
      }
    };
    // Unknown route or first paint: snap. Otherwise glide.
    if (posRef.current === null || Math.abs(target - posRef.current) < 0.0001) {
      place(target);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(target);
      return;
    }
    const from = posRef.current;
    const start = performance.now();
    const duration = 460;
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      place(from + (target - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-nav fixed inset-x-0 bottom-[max(14px,calc(env(safe-area-inset-bottom)-14px))] z-40 px-4 lg:hidden"
    >
      <LiquidGlass
        ref={lensRef}
        x={0.1}
        y={LENS_Y}
        width={54}
        height={54}
        radius="auto"
        strength={0.085}
        chromaticAberration={0.2}
        depth={7}
        curvature={0.75}
        glow={0.18}
        edgeHighlight={0.32}
        specular={0.95}
        blur={0}
        shadow={false}
        quality={256}
        className="mobile-nav-dock liquid-glass mx-auto max-w-md px-1.5 py-1.5"
      >
        <div className="relative flex items-stretch">
          <span
            ref={glowRef}
            aria-hidden
            className="mobile-nav-glow pointer-events-none absolute z-0 size-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: "10%", top: `${LENS_Y * 100}%` }}
          />
          {tabs.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "relative z-10 flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[1.3rem] outline-none transition-colors duration-200",
                  isActive ? "text-white" : "text-white/40 active:text-white/65",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex size-9 items-center justify-center">
                    <Icon className="relative z-10 size-[20px]" strokeWidth={isActive ? 2.1 : 1.7} />
                  </span>
                  <span className="relative z-10 text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </LiquidGlass>
    </nav>
  );
}
