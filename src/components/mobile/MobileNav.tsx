import { motion } from "framer-motion";
import { Activity, CalendarDays, Home, UserRound, Utensils } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for the mobile tabs. Desktop/tablet never renders
 * this component — the shell switches on useIsMobile().
 */
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

/**
 * Floating bottom navigation (phones only).
 *
 * Architecture:
 * - One glass surface: the dock itself (existing `.liquid-glass` token system).
 * - One active indicator: a subtle white/gray glass dome moved with a single
 *   framer-motion layoutId spring — no bouncing, no glow, no refraction over
 *   icons or labels.
 * - Hit targets stay clickable: overlays are pointer-events-none; only the
 *   NavLinks receive touches.
 * - Safe areas: the dock floats above the home indicator using
 *   env(safe-area-inset-bottom); content clearance lives in AppShell.
 * - Reduced motion: MotionConfig reducedMotion="user" in main.tsx makes the
 *   layout spring resolve instantly.
 */
export function MobileNav() {
  const { pathname } = useLocation();
  const activeIndex = activeTabIndex(pathname);
  const hasActive = activeIndex >= 0;

  return (
    <nav
      aria-label="Main"
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      {/* Tappable dead zone under the dock so nothing underneath reacts. */}
      <div className="h-[calc(22px+env(safe-area-inset-bottom))] w-full" />
      <div className="px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="mobile-nav-dock liquid-glass mx-auto flex max-w-md items-stretch gap-1 rounded-[1.6rem] p-1.5">
          {tabs.map(({ label, to, icon: Icon }, index) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              aria-current={index === activeIndex ? "page" : undefined}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-[52px] flex-1 touch-manipulation select-none flex-col items-center justify-center gap-[3px] rounded-[1.25rem] outline-none transition-colors duration-200",
                  isActive ? "text-white" : "text-white/45 active:text-white/70",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && hasActive && (
                    <motion.span
                      layoutId="mobile-nav-dome"
                      className="mobile-nav-dome pointer-events-none absolute inset-0 rounded-[1.25rem]"
                      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.9 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 size-[21px] transition-transform duration-200",
                      isActive && "scale-[1.06]",
                    )}
                    strokeWidth={isActive ? 2 : 1.7}
                  />
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-medium tracking-wide transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-80",
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
