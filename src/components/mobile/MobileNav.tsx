import { motion } from "framer-motion";
import { Activity, CalendarDays, Home, UserRound, Utensils } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Plan", to: "/dashboard/plan", icon: CalendarDays },
  { label: "Food", to: "/dashboard/food", icon: Utensils },
  { label: "Progress", to: "/dashboard/progress", icon: Activity },
  { label: "Me", to: "/dashboard/profile", icon: UserRound },
] as const;

/**
 * Floating liquid-glass dock. The active tab gets a circular "orb" behind its
 * icon — a single framer-motion element (shared layoutId) that springs from
 * tab to tab as the route changes.
 */
export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-nav fixed inset-x-0 bottom-[max(14px,calc(env(safe-area-inset-bottom)-14px))] z-40 px-4 lg:hidden"
    >
      <div className="mobile-nav-dock liquid-glass mx-auto flex max-w-md items-stretch px-1.5 py-1.5">
        {tabs.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[1.3rem] outline-none transition-colors duration-200",
                isActive ? "text-white" : "text-white/40 active:text-white/65",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex size-9 items-center justify-center">
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-active-orb"
                      className="mobile-nav-orb absolute -inset-1 rounded-full"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon className="relative z-10 size-[20px]" strokeWidth={isActive ? 2.1 : 1.7} />
                </span>
                <span className="relative z-10 text-[10px] font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
