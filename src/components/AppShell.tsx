import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  CreditCard,
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

const accountLinks = [
  { label: "Profile", to: "/dashboard/profile", icon: UserRound },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
  { label: "Subscription", to: "/dashboard/upgrade", icon: CreditCard },
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
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
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const logout = async () => {
    await signOut();
    navigate("/");
  };
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
            {accountLinks.map(({ label, to, icon: Icon }) => (
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
        </nav>

        <div ref={accountRef} className="relative border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-white/[0.06]"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-9 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[11px] font-semibold text-black">
                {initials(displayName)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white/80">{displayName}</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/30">
                {username ? `@${username}` : "Account"}
              </span>
            </span>
            <ChevronRight
              className={`size-4 text-white/30 transition-transform ${accountOpen ? "rotate-90" : ""}`}
            />
          </button>

          <AnimatePresence>
            {accountOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-[calc(100%+12px)] left-0 right-0 overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-solid)]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
              >
                <div className="border-b border-white/[0.08] px-3 py-2.5">
                  <p className="truncate text-xs text-white/70">{displayName}</p>
                  <p className="mt-1 truncate text-[11px] text-white/30">{user?.email}</p>
                </div>
                {username && (
                  <button
                    type="button"
                    onClick={() => navigate(`/u/${encodeURIComponent(username)}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <UserRound className="size-4" />
                    View public profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          <div className="hidden lg:block" />
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
