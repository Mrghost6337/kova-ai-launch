import { Activity, CalendarDays, ChevronRight, CircleUserRound, Dumbbell, Home, LogOut, Settings, Utensils, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useState } from "react";
import { KovaLogo } from "@/components/KovaLogo";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

const navigation = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Plan", to: "/dashboard/plan", icon: CalendarDays },
  { label: "Food", to: "/dashboard/food", icon: Utensils },
  { label: "Progress", to: "/dashboard/progress", icon: Activity },
  { label: "Profile", to: "/dashboard/profile", icon: CircleUserRound },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Athlete";

  const logout = async () => { await signOut(); navigate("/"); };
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.08] bg-black/90 p-5 backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><button type="button" onClick={() => navigate("/")} className="flex items-center gap-3 text-white"><KovaLogo className="size-9 rounded-[23%] ring-1 ring-white/15" /><span className="text-sm font-semibold uppercase tracking-[0.24em]">KOVA <span className="font-light text-white/45">AI</span></span></button><button type="button" onClick={close} className="flex size-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close navigation"><X className="size-4" /></button></div>
        <div className="mt-12 flex-1 space-y-1">{navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === "/dashboard"} onClick={close} className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors ${isActive ? "bg-white text-black" : "text-white/45 hover:bg-white/[0.06] hover:text-white"}`}><Icon className="size-[17px]" strokeWidth={1.6} /><span>{label}</span>{label === "Plan" && <ChevronRight className="ml-auto size-3 opacity-40" />}</NavLink>)}</div>
        <div className="border-t border-white/[0.08] pt-4"><div className="mb-3 rounded-2xl bg-white/[0.045] p-3"><p className="truncate text-sm text-white/80">{displayName}</p><p className="mt-1 truncate text-[11px] text-white/30">{user?.email}</p></div><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"><LogOut className="size-[17px]" strokeWidth={1.6} />Sign out</button></div>
      </aside>
      {mobileOpen && <button type="button" aria-label="Close navigation overlay" onClick={close} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
      <div className="lg:pl-[250px]"><header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/[0.07] bg-black/55 px-5 backdrop-blur-xl sm:px-8 lg:px-10"><button type="button" onClick={() => setMobileOpen(true)} className="flex items-center gap-3 lg:hidden"><KovaLogo className="size-8 rounded-[23%] ring-1 ring-white/15" /><span className="text-xs font-semibold uppercase tracking-[0.22em]">KOVA AI</span></button><div className="hidden text-[10px] uppercase tracking-[0.2em] text-white/30 lg:block">KOVA AI · Training workspace</div><button type="button" onClick={() => navigate("/dashboard/profile")} className="flex items-center gap-2 text-right"><span className="hidden text-xs text-white/45 sm:block">{displayName}</span><span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs text-white/70">{displayName.slice(0, 1).toUpperCase()}</span></button></header><main className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10">{children}</main></div>
    </div>
  );
}
