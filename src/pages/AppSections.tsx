import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Moon,
  Navigation,
  Save,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { GymMapPicker, type GymLocation } from "@/components/GymMapPicker";
import { Seo } from "@/components/Seo";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useTheme, type Theme } from "@/hooks/use-theme";
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
        {profile?.is_public && profile.username ? <Link to={`/u/${encodeURIComponent(profile.username)}`} className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-kova-sky hover:text-white">View your public profile <ExternalLink className="size-3" /></Link> : null}
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

const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun; hint: string }> = [
  { value: "dark", label: "Dark", icon: Moon, hint: "Deep black and glass" },
  { value: "light", label: "Light", icon: Sun, hint: "Soft, bright and minimal" },
  { value: "system", label: "System", icon: Monitor, hint: "Follows your device" },
];

function Section({ children, icon: Icon, title, description }: { children: React.ReactNode; icon: typeof Bell; title: string; description: string }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-3"><Icon className="size-4 text-white/50" /><div><h2 className="text-sm font-medium text-white/75">{title}</h2><p className="mt-1 text-sm text-white/35">{description}</p></div></div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Settings() {
  const { user } = useSupabaseAuth();
  const { profile, update } = useKovaProfile(user?.id);
  const { theme, resolved, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(() => localStorage.getItem("kova-notifications") !== "off");
  const [reminders, setReminders] = useState(() => localStorage.getItem("kova-reminders") === "on");
  const [password, setPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);
  const [gym, setGym] = useState<GymLocation | null>(null);
  const [savingGym, setSavingGym] = useState(false);
  const [gymSaved, setGymSaved] = useState(false);
  const [gymError, setGymError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setGym(profile.gym_name && profile.gym_lat != null && profile.gym_lng != null
      ? {
          name: profile.gym_name,
          lat: profile.gym_lat,
          lng: profile.gym_lng,
          osmType: (profile.gym_osm_type as GymLocation["osmType"]) ?? undefined,
          osmId: profile.gym_osm_id ?? undefined,
          openingHours: profile.gym_opening_hours ?? null,
        }
      : null);
  }, [profile]);

  const saveGym = async (location: GymLocation) => {
    setSavingGym(true); setGymError("");
    try {
      await update({
        gym_name: location.name,
        gym_lat: location.lat,
        gym_lng: location.lng,
        gym_osm_type: location.osmType ?? null,
        gym_osm_id: location.osmId ?? null,
        gym_opening_hours: location.openingHours ?? null,
      });
      setGym(location); setGymSaved(true);
      window.setTimeout(() => setGymSaved(false), 2500);
    } catch (cause) {
      setGymError(cause instanceof Error ? cause.message : "Could not save your gym.");
    } finally { setSavingGym(false); }
  };

  const removeGym = async () => {
    setSavingGym(true); setGymError("");
    try {
      await update({ gym_name: null, gym_lat: null, gym_lng: null, gym_osm_type: null, gym_osm_id: null, gym_opening_hours: null });
      setGym(null); setGymSaved(false);
    } catch (cause) {
      setGymError(cause instanceof Error ? cause.message : "Could not remove your gym.");
    } finally { setSavingGym(false); }
  };

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
      <Section icon={Sun} title="Appearance" description="Choose how KOVA looks. The choice is saved on this device and follows you between visits.">
        <div className="grid gap-2 sm:grid-cols-3">
          {themeOptions.map(({ value, label, icon: Icon, hint }) => {
            const active = theme === value;
            return (
              <button key={value} type="button" onClick={() => setTheme(value)} className={`rounded-2xl border p-4 text-left transition-colors ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"}`}>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4" />{label}
                  {active && <Check className="ml-auto size-4" />}
                </span>
                <span className={`mt-2 block text-xs ${active ? "text-black/50" : "text-white/35"}`}>{hint}{value === "system" ? ` · ${resolved} now` : ""}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section icon={UserRound} title="Account" description="Your name, username and public profile.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-white/75">{profile?.display_name || user?.email}</p>
            <p className="mt-1 truncate text-xs text-white/35">{user?.email}</p>
          </div>
          <Link to="/dashboard/profile" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-medium text-white/70 hover:bg-white/[0.06]">Edit profile <ExternalLink className="size-3" /></Link>
        </div>
      </Section>
      <Section icon={Bell} title="Notifications" description="Preferences are saved on this device until notification delivery is connected.">
        <div className="divide-y divide-white/10">
          <ToggleRow label="KOVA notifications" description="Allow this device to show KOVA updates." checked={notifications} onChange={changeNotifications} />
          <ToggleRow label="Workout reminders" description="Keep reminders ready for when scheduling is connected." checked={reminders} onChange={changeReminders} />
        </div>
      </Section>
      <Section icon={Lock} title="Privacy" description="Control whether your profile can be discovered by others.">
        <ToggleRow label="Public profile" description="Let athletes search for you, follow you and see your shared plans and sessions." checked={profile?.is_public ?? false} onChange={(value) => void updatePrivacy(value)} />
      </Section>
      <Section icon={MapPin} title="Gym" description="Pick the gym you train at. The live map finds real gyms near you — search, drop a pin or use your location.">
        {gym && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kova-emerald/10 text-kova-emerald"><MapPin className="size-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white/80">{gym.name}</p>
                <p className="mt-0.5 text-xs text-white/35">{gym.lat.toFixed(5)}, {gym.lng.toFixed(5)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs text-white/70 hover:bg-white/[0.06]">Directions <Navigation className="size-3" /></a>
              <button type="button" onClick={() => void removeGym()} disabled={savingGym} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs text-white/50 hover:bg-white/[0.06] disabled:opacity-50"><Trash2 className="size-3" />Remove</button>
            </div>
          </div>
        )}
        <GymMapPicker value={gym} onChange={(location) => void saveGym(location)} saving={savingGym} />
        {gymSaved && <p className="mt-3 flex items-center gap-2 text-sm text-white/60"><Check className="size-4" />Gym saved.</p>}
        {gymError && <p className="mt-3 text-sm text-red-200">{gymError}</p>}
      </Section>
      <Section icon={Lock} title="Security" description="Change your password for this KOVA account.">
        <form onSubmit={updatePassword} className="flex flex-col gap-3 sm:flex-row">
          <input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30" />
          <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Update password</button>
        </form>
        {passwordError && <p className="mt-3 text-sm text-red-200">{passwordError}</p>}{passwordMessage && <p className="mt-3 text-sm text-white/60">{passwordMessage}</p>}
      </Section>
      <Section icon={CreditCard} title="Subscription" description="Billing becomes available when a verified subscription is connected.">
        <a href="/dashboard/upgrade" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/55 hover:text-white">View plans <ExternalLink className="size-3" /></a>
      </Section>
    </div>
  </div></AppShell>;
}

export function Upgrade() { return <AppShell><Seo title="Upgrade — KOVA AI" description="KOVA AI plans and subscription options." path="/dashboard/upgrade" /><div className="mx-auto max-w-5xl"><p className="eyebrow">KOVA membership</p><h1 className="mt-3 font-serif text-6xl italic tracking-[-0.08em]">Upgrade.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Choose the level of coaching that fits you. Subscription status and payments will only appear here once they are connected to a verified billing account.</p><div className="mt-10 grid gap-4 md:grid-cols-3">{["Free", "Pro", "Max"].map((name) => <article key={name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6"><p className="text-[10px] uppercase tracking-[0.18em] text-white/30">KOVA</p><h2 className="mt-8 font-serif text-4xl italic">{name}</h2><p className="mt-4 text-sm leading-6 text-white/40">Plan details will be shown from the connected billing provider.</p><span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/35">Not active <ExternalLink className="size-3" /></span></article>)}</div></div></AppShell>; }