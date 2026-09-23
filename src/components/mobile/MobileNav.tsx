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

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {tabs.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "relative flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
                isActive ? "text-white" : "text-white/40",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 rounded-2xl bg-white/[0.1]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative z-10 size-[21px]" strokeWidth={isActive ? 2 : 1.6} />
                <span className="relative z-10 text-[10px] font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
