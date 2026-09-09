import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Moon,
  Save,
  Sun,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Seo } from "@/components/Seo";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";

function EmptySection({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-7xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">{title}</h1>
      <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">{description}</p>
      <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-7 sm:p-10">
        <Lock className="size-5 text-white/40" />
        <h2 className="mt-6 font-serif text-3xl italic">Nothing to show yet.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/40">Once you create a plan and log real sessions, this space will reflect your training. KOVA will never fill it with placeholder numbers.</p>
      </div>
    </div>
  );
}

export function Food() {
  return <AppShell><Seo title="Food — KOVA AI" description="Simple nutrition guidance connected to your KOVA plan." path="/dashboard/food" /><EmptySection eyebrow="Nutrition" title="Food." description="Keep nutrition simple, useful and connected to the way you train." /></AppShell>;
}

export function Progress() {
  return <AppShell><Seo title="Progress — KOVA AI" description="Understand your real KOVA AI training progress." path="/dashboard/progress" /><EmptySection eyebrow="Your history" title="Progress." description="Your meaningful changes will live here: completed workouts, strength, consistency and more." /></AppShell>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs text-white/45">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" /></label>;
}

export function Profile() {
  const { user } = useSupabaseAuth();
  const { profile, isLoading, update } = useKovaProfile(user?.id);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setUsername(profile.username ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setBio(profile.bio ?? "");
    setGoal(profile.fitness_goal ?? "");
    setLevel(profile.training_level ?? "");
    setIsPublic(profile.is_public);
  }, [profile]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      await update({
        display_name: displayName.trim() || null,
        username: username.trim().toLowerCase() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        fitness_goal: goal.trim() || null,
        training_level: level.trim() || null,
        is_public: isPublic,
      });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    } finally { setSaving(false); }
  };

  const initials = (displayName || user?.email || "K").slice(0, 1).toUpperCase();
  return (
    <AppShell>
      <Seo title="Profile — KOVA AI" description="Manage your KOVA AI profile." path="/dashboard/profile" />
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Your identity</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Profile.</h1>
        <p className="mt-5 text-sm leading-7 text-white/45">Keep your account and training context up to date. These details are saved to your private Supabase profile.</p>
        <form onSubmit={save} className="mt-10 space-y-4">
          <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="size-14 rounded-full border border-white/15 object-cover" /> : <span className="flex size-14 items-center justify-center rounded-full bg-white text-xl text-black">{initials}</span>}
            <div className="min-w-0"><p className="truncate text-sm text-white/75">{user?.email}</p><p className="mt-1 text-xs text-white/35">Your login email · managed by Supabase Auth</p></div>
          </div>
          <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="How should KOVA call you?" />
          <Field label="Username" value={username} onChange={(value) => setUsername(value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="your_username" />
          <Field label="Profile picture URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://…" type="url" />
          <label className="block"><span className="mb-2 block text-xs text-white/45">Bio</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A little about your training" className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Fitness goal" value={goal} onChange={setGoal} placeholder="e.g. Build muscle" /><Field label="Training experience" value={level} onChange={setLevel} placeholder="e.g. Beginner" /></div>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4"><span><span className="block text-sm text-white/70">Public profile</span><span className="mt-1 block text-xs text-white/35">Allow people to find your profile and public plans.</span></span><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} className="size-4 accent-white" /></label>
          {error && <p className="text-sm text-red-200">{error}</p>}{saved && <p className="flex items-center gap-2 text-sm text-white/60"><Check className="size-4" />Profile saved.</p>}
          <button type="submit" disabled={saving || isLoading} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save profile</button>
        </form>
      </div>
    </AppShell>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 py-4"><span><span className="block text-sm text-white/75">{label}</span><span className="mt-1 block text-xs leading-5 text-white/35">{description}</span></span><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? "border-white bg-white" : "border-white/15 bg-white/[0.08]"}`}><span className={`absolute top-1 size-4 rounded-full transition-transform ${checked ? "translate-x-6 bg-black" : "translate-x-1 bg-white/50"}`} /></button></label>;
}

export function Settings() {
  const { user } = useSupabaseAuth();
  const { profile, update } = useKovaProfile(user?.id);
  const [theme, setTheme] = useState(() => localStorage.getItem("kova-theme") ?? "dark");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("kova-notifications") !== "off");
  const [reminders, setReminders] = useState(() => localStorage.getItem("kova-reminders") === "on");
  const [password, setPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      const systemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      document.documentElement.classList.toggle("light", theme === "light" || (theme === "system" && systemLight));
    };
    applyTheme();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  const changeTheme = (value: string) => { setTheme(value); localStorage.setItem("kova-theme", value); };
  const changeNotifications = (value: boolean) => { setNotifications(value); localStorage.setItem("kova-notifications", value ? "on" : "off"); };
  const changeReminders = (value: boolean) => { setReminders(value); localStorage.setItem("kova-reminders", value ? "on" : "off"); };
  const updatePrivacy = async (value: boolean) => { if (profile) await update({ is_public: value }); };
  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setPasswordError(""); setPasswordMessage("");
    if (password.length < 6) { setPasswordError("Use at least 6 characters."); setBusy(false); return; }
    if (!supabase) { setPasswordError("Supabase is not configured."); setBusy(false); return; }
    const result = await supabase.auth.updateUser({ password });
    if (result.error) setPasswordError(result.error.message); else { setPassword(""); setPasswordMessage("Password updated."); }
    setBusy(false);
  };

  return <AppShell><Seo title="Settings — KOVA AI" description="Manage your KOVA AI app settings." path="/dashboard/settings" /><div className="mx-auto max-w-3xl"><p className="eyebrow">Workspace</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Settings.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/45">A calm place to tune KOVA to the way you train and live.</p>
    <div className="mt-10 space-y-4">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center gap-3"><Sun className="size-4 text-white/50" /><h2 className="text-sm font-medium text-white/75">Appearance</h2></div><p className="mt-1 text-sm text-white/35">Choose how KOVA looks on this device.</p><div className="mt-5 flex flex-wrap gap-2">{[["dark", Moon], ["light", Sun], ["system", UserRound]].map(([value, Icon]) => <button key={value as string} type="button" onClick={() => changeTheme(value as string)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs capitalize transition-colors ${theme === value ? "border-white bg-white text-black" : "border-white/10 text-white/50 hover:text-white"}`}><Icon className="size-3.5" />{value as string}</button>)}</div></section>
      <section className="divide-y divide-white/10 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6"><div className="flex items-center gap-3 py-6"><Bell className="size-4 text-white/50" /><div><h2 className="text-sm font-medium text-white/75">Notifications</h2><p className="mt-1 text-sm text-white/35">Preferences are saved on this device until notification delivery is connected.</p></div></div><ToggleRow label="KOVA notifications" description="Allow this device to show KOVA updates." checked={notifications} onChange={changeNotifications} /><ToggleRow label="Workout reminders" description="Keep reminders ready for when scheduling is connected." checked={reminders} onChange={changeReminders} /></section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"><h2 className="text-sm font-medium text-white/75">Training</h2><p className="mt-1 text-sm leading-6 text-white/35">Your plan maker uses your availability, experience and goals. Update those details from your Plan.</p></section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"><h2 className="text-sm font-medium text-white/75">Privacy</h2><p className="mt-1 text-sm text-white/35">Control whether your profile can be discovered by others.</p><div className="mt-3"><ToggleRow label="Public profile" description="Use your Supabase profile visibility setting." checked={profile?.is_public ?? false} onChange={(value) => void updatePrivacy(value)} /></div></section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"><h2 className="text-sm font-medium text-white/75">Security</h2><p className="mt-1 text-sm text-white/35">Change your password for this KOVA account.</p><form onSubmit={updatePassword} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" /><button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Update password</button></form>{passwordError && <p className="mt-3 text-sm text-red-200">{passwordError}</p>}{passwordMessage && <p className="mt-3 text-sm text-white/60">{passwordMessage}</p>}</section>
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-sm font-medium text-white/75">Subscription</h2><p className="mt-1 text-sm leading-6 text-white/35">Billing becomes available when a verified subscription is connected.</p></div><a href="/dashboard/upgrade" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/55 hover:text-white">View plans <ExternalLink className="size-3" /></a></div></section>
    </div>
  </div></AppShell>;
}

export function Upgrade() { return <AppShell><Seo title="Upgrade — KOVA AI" description="KOVA AI plans and subscription options." path="/dashboard/upgrade" /><div className="mx-auto max-w-5xl"><p className="eyebrow">KOVA membership</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Upgrade.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Choose the level of coaching that fits you. Subscription status and payments will only appear here once they are connected to a verified billing account.</p><div className="mt-10 grid gap-4 md:grid-cols-3">{["Free", "Pro", "Max"].map((name) => <article key={name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><p className="text-[10px] uppercase tracking-[0.18em] text-white/30">KOVA</p><h2 className="mt-8 font-serif text-4xl italic">{name}</h2><p className="mt-4 text-sm leading-6 text-white/40">Plan details will be shown from the connected billing provider.</p><span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/35">Not active <ExternalLink className="size-3" /></span></article>)}</div></div></AppShell>; }
