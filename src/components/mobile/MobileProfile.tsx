import { motion } from "framer-motion";
import { ChevronRight, CreditCard, ExternalLink, Loader2, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Seo } from "@/components/Seo";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "K";
}

function Row({ icon: Icon, label, value, onClick, external }: { icon: typeof UserRound; label: string; value?: string; onClick?: () => void; external?: string }) {
  const content = (
    <span className="flex w-full items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/60"><Icon className="size-4" /></span>
        <span className="min-w-0">
          <span className="block text-sm text-white/85">{label}</span>
          {value ? <span className="mt-0.5 block truncate text-[11px] text-white/35">{value}</span> : null}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/25" />
    </span>
  );
  const className = "liquid-glass flex min-h-[64px] w-full items-center rounded-[1.4rem] p-4 text-left";
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>;
  if (external) return <a href={external} className={className}>{content}</a>;
  return <div className={className}>{content}</div>;
}

export function MobileProfile() {
  const { user, signOut } = useSupabaseAuth();
  const { profile } = useKovaProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = profile?.display_name || (typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") || user?.email?.split("@")[0] || "Athlete";
  const avatarUrl = profile?.avatar_url || (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "") || "";

  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <Seo title="Profile — KOVA AI" description="Your KOVA AI account." path="/dashboard/profile" />
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center pt-2 text-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-20 rounded-full border border-white/15 object-cover" />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-white text-2xl font-semibold text-black">{initials(displayName)}</span>
        )}
        <h1 className="mt-4 font-serif text-4xl italic tracking-[-0.05em]">{displayName}</h1>
        <p className="mt-1 text-xs text-white/35">{profile?.username ? `@${profile.username}` : user?.email}</p>
        {profile?.is_public && profile.username ? (
          <Link to={`/u/${encodeURIComponent(profile.username)}`} className="mt-2.5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-kova-sky">View public profile <ExternalLink className="size-3" /></Link>
        ) : null}
      </motion.header>

      {/* Appearance */}
      <section className="liquid-glass rounded-[1.4rem] p-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Appearance</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => setTheme(value)} className={cn("flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-medium transition-colors", theme === value ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.02] text-white/55")}>
              <Icon className="size-4" />{label}
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <div className="space-y-3">
        <Row icon={UserRound} label="Edit profile" value={user?.email} onClick={() => navigate("/dashboard/profile")} />
        <Row icon={Settings} label="Settings" value="Gym, privacy, security" onClick={() => navigate("/dashboard/settings")} />
        <Row icon={CreditCard} label="Subscription" value="Plans and billing" onClick={() => navigate("/dashboard/upgrade")} />
      </div>

      <button type="button" onClick={() => void logout()} disabled={signingOut} className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-[1.4rem] border border-red-300/20 text-sm font-medium text-red-200/80 disabled:opacity-50">
        {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}Sign out
      </button>
    </div>
  );
}
