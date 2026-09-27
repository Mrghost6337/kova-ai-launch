import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Globe,
  Home,
  LogOut,
  Settings,
  UserRound,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { KovaLogo } from "@/components/KovaLogo";
import { cn } from "@/lib/utils";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { MobileNav } from "@/components/mobile/MobileNav";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTheme } from "@/hooks/use-theme";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useKovaProfile } from "@/hooks/use-kova-app";

const navigation = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Plan", to: "/dashboard/plan", icon: CalendarDays },
  { label: "Food", to: "/dashboard/food", icon: Utensils },
  { label: "Progress", to: "/dashboard/progress", icon: Activity },
  { label: "Social", to: "/dashboard/social", icon: Users },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "K"
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const shell = useDashboardShell(children);
  if (isMobile) return <MobileShell>{children}</MobileShell>;
  return shell;
}

/** Desktop/tablet shell — redesigned liquid-glass nav rail. */
function useDashboardShell(children: React.ReactNode) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useSupabaseAuth();
  const { profile } = useKovaProfile(user?.id);
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof metadata?.display_name === "string" && metadata.display_name.trim()
      ? metadata.display_name
      : user?.email?.split("@")[0] || "Athlete";
  const avatarUrl =
    typeof metadata?.avatar_url === "string" ? metadata.avatar_url : profile?.avatar_url || "";
  const username = profile?.username;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div
      className={`app-shell min-h-screen bg-[var(--app-bg)] text-white ${resolved === "light" ? "light" : ""}`}
    >
      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col p-5 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 text-white transition-opacity hover:opacity-75"
          >
            <KovaLogo className="size-9 rounded-[23%] ring-1 ring-white/15" />
            <span className="text-sm font-semibold uppercase tracking-[0.24em]">
              KOVA <span className="font-light text-white/45">AI</span>
            </span>
          </button>
          <button
            type="button"
            onClick={closeMobile}
            className="flex size-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="mt-10 flex-1 space-y-0.5" aria-label="Primary">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              onClick={closeMobile}
              className={({ isActive }) => `nav-rail-link ${isActive ? "nav-rail-link--active" : ""}`}
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="nav-rail-pill" aria-hidden /> : null}
                  <Icon className="relative size-[17px]" strokeWidth={1.6} />
                  <span className="relative text-sm">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="!mt-8 border-t border-white/[0.07] pt-6">
            {([
              { label: "Profile", to: "/dashboard/profile", icon: UserRound },
              { label: "Settings", to: "/dashboard/settings", icon: Settings },
              { label: "Subscription", to: "/dashboard/upgrade", icon: CreditCard },
            ] as const).map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobile}
                className={({ isActive }) => `nav-rail-link ${isActive ? "nav-rail-link--active" : ""}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive ? <span className="nav-rail-pill" aria-hidden /> : null}
                    <Icon className="relative size-4" strokeWidth={1.6} />
                    <span className="relative text-sm">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between px-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
            <span>Build v2.1.0</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--accent-sky)] shadow-[0_0_10px_-2px_var(--accent-sky)]" />
              Live
            </span>
          </div>
        </nav>

        <AccountMenu
          variant="rail"
          displayName={displayName}
          email={user?.email}
          avatarUrl={avatarUrl ?? undefined}
          username={username ?? undefined}
          onSignOut={() => {
            void signOut();
            navigate("/");
          }}
        />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <div className="lg:pl-[248px]">
        <header
          className={`app-navbar sticky top-0 z-30 flex h-16 items-center justify-between px-6 sm:px-8 lg:px-12 ${scrolled ? "app-navbar--scrolled" : ""}`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-3 lg:hidden"
          >
            <KovaLogo className="size-8 rounded-[23%] ring-1 ring-white/15" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em]">KOVA AI</span>
          </button>
          <div className="hidden text-[10px] uppercase tracking-[0.2em] text-white/30 lg:block">
            Training workspace
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/profile")}
            className="flex items-center gap-2 text-right lg:hidden"
          >
            <span className="hidden text-xs text-white/45 sm:block">{displayName}</span>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-8 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs text-white/70">
                {initials(displayName)}
              </span>
            )}
          </button>
          <div className="hidden lg:block">
            <AccountMenu
              variant="topbar"
              displayName={displayName}
              email={user?.email}
              avatarUrl={avatarUrl ?? undefined}
              username={username ?? undefined}
              onSignOut={() => {
                void signOut();
                navigate("/");
              }}
            />
          </div>
        </header>
        <main className="px-6 py-10 sm:px-8 lg:px-12">{children}</main>
      </div>

      <OnboardingGate />
    </div>
  );
}

/** The existing mobile app shell — activates only on phones (≤767px). */
function MobileShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useSupabaseAuth();
  const { profile } = useKovaProfile(user?.id);
  const { resolved } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    typeof metadata?.display_name === "string" && metadata.display_name.trim()
      ? metadata.display_name
      : user?.email?.split("@")[0] || "Athlete";
  const avatarUrl =
    typeof metadata?.avatar_url === "string" ? metadata.avatar_url : profile?.avatar_url || "";

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div
      className={`app-shell app-shell--mobile min-h-[100dvh] bg-[var(--app-bg)] text-white ${resolved === "light" ? "light" : ""}`}
    >
      <header className="mobile-topbar sticky top-0 z-30 flex h-[56px] items-center justify-between px-5">
        <button type="button" onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5">
          <KovaLogo className="size-7 rounded-[23%] ring-1 ring-white/15" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em]">KOVA AI</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard/profile")}
          aria-label="Open profile"
          className="flex items-center"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-8 rounded-full border border-white/15 object-cover"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[10px] font-semibold text-white/80">
              {initials(displayName)}
            </span>
          )}
        </button>
      </header>

      <main className="mobile-content px-4 pb-[calc(112px+max(12px,env(safe-area-inset-bottom)))] pt-2">
        {children}
      </main>
      <MobileNav />
      <OnboardingGate />
    </div>
  );
}

/**
 * Glass account menu — makes Profile / Settings / Subscription visible and
 * reachable from both the nav rail and the topbar. Springy scale+rise open,
 * staggered item entrance, close on outside click / route change / Escape.
 */
function AccountMenu({
  variant,
  displayName,
  email,
  avatarUrl,
  username,
  onSignOut,
}: {
  variant: "rail" | "topbar";
  displayName: string;
  email?: string;
  avatarUrl: string;
  username?: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    }; 
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const avatar = avatarUrl ? (
    <img src={avatarUrl} alt="" className="size-9 rounded-full border border-white/15 object-cover" />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[11px] font-semibold text-black">
      {initials(displayName)}
    </span>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          variant === "rail"
            ? "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/[0.06]"
            : "glass-chip flex h-10 items-center gap-2 !rounded-full pr-3.5"
        }
        id={variant === "rail" ? "account-menu-button" : undefined}
        aria-labelledby={variant === "topbar" ? "account-menu-button" : undefined}
      >
        {variant === "topbar" ? (
          <span className="hidden truncate pl-1 text-xs text-white/45 sm:block">{displayName.split(" ")[0]}</span>
        ) : null}
        {avatar}
        {variant === "rail" ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-white/80">{displayName}</span>
            <span className="mt-0.5 block truncate text-[11px] text-white/30">
              {username ? `@${username}` : "Account"}
            </span>
          </span>
        ) : null}
        {variant === "rail" ? (
          <ChevronUp className={`size-4 text-white/30 transition-transform duration-300 [transition-timing-function:var(--ease-app)] ${open ? "rotate-180" : ""}`} />
        ) : (
          <ChevronDown className={`size-3.5 text-white/40 transition-transform duration-300 [transition-timing-function:var(--ease-app)] ${open ? "rotate-180" : ""}`} />
      )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.7 }}
            style={{ transformOrigin: variant === "rail" ? "bottom left" : "top right" }}
            className={cn(
              "account-menu p-1.5",
              variant === "rail"
                ? "bottom-[calc(100%+12px)] left-0 right-0"
                : "right-0 top-[calc(100%+12px)] min-w-[16.5rem]",
            )}
            role="menu"
            aria-label="Account menu"
         >
            <div className="border-b border-white/[0.08] px-3 pb-2.5 pt-2">
              <p className="truncate text-sm text-white/85">{displayName}</p>
              <p className="mt-0.5 truncate text-[11px] text-white/30">{email}</p>
            </div>
            {[
              { label: "Profile", to: "/dashboard/profile", icon: UserRound, desc: "Name, body stats, privacy" },
              { label: "Settings", to: "/dashboard/settings", icon: Settings, desc: "Appearance, gym, security" },
              { label: "Subscription", to: "/dashboard/upgrade", icon: CreditCard, desc: "Plan & billing" },
            ].map(({ label, to, icon: Icon, desc }, index) => (
              <motion.button
                key={to}
                type="button"
                role="menuitem"
                onClick={() => go(to)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * index, duration: 0.2 }}
                className="account-menu__item mt-0.5 text-left"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/55">
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block leading-tight">{label}</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-white/28">{desc}</span>
              </span>
                </motion.button>
            ))}
            {username && (
              <motion.button
                type="button"
                role="menuitem"
                onClick={() => go(`/u/${encodeURIComponent(username)}`)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.09, duration: 0.2 }}
                className="account-menu__item mt-0.5 text-left"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/55">
                  <Globe className="size-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">View public profile</span>
              </motion.button>
            )}
            <motion.button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: username ? 0.12 : 0.09, duration: 0.2 }}
              className="account-menu__item mt-0.5 text-left"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/45">
                <LogOut className="size-4" strokeWidth={1.7} />
              </span>
              Sign out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * First-time onboarding. Shows once per account until the athlete finishes it;
 * the answer set is persisted to their real Supabase profile.
 */
function OnboardingGate() {
  const { user } = useSupabaseAuth();
  const { profile, isLoading, update } = useKovaProfile(user?.id);
  if (isLoading || !user || !profile) return null;
  if (profile.onboarding_completed) return null;
  return <OnboardingFlow />;
}
