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
  Navigation,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import {
  GlassButton,
  GlassCard,
  GlassField,
  GlassTextarea,
  SectionHeader,
  ThemeSwitch,
  ToggleRow,
} from "@/components/glass";
import { GymMapPicker, type GymLocation } from "@/components/GymMapPicker";
import { gymStatus } from "@/lib/opening-hours";
import { Seo } from "@/components/Seo";
import { useKovaProfile } from "@/hooks/use-kova-app";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

/* ————————————————————————————————————————————————————————————————————————
   Account sections: Profile, Settings, Upgrade. One glass system, real
   persistence everywhere. The Progress section used to live here; it moved
   to its own redesigned page (src/pages/Progress.tsx).
   ———————————————————————————————————————————————————————————————————————— */

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

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
    setSaving(true);
    setError("");
    setSaved(false);
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
      window.setTimeout(() => setSaved(false), 2500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const letter = (displayName || user?.email || "K").slice(0, 1).toUpperCase();

  return (
    <AppShell>
      <Seo title="Profile — KOVA AI" description="Manage your KOVA AI profile." path="/dashboard/profile" />
      <div className="mx-auto max-w-3xl">
        <motion.div {...pageMotion}>
          <p className="t-label">Your identity</p>
          <h1 className="t-display mt-4">Profile.</h1>
          <p className="t-body mt-4 max-w-lg">
            Keep your account and training context up to date. These details are saved to your
            private profile.
          </p>
          {profile?.is_public && profile.username ? (
            <Link
              to={`/u/${encodeURIComponent(profile.username)}`}
              className="glass-chip mt-5 h-9 px-4 text-xs"
            >
              View your public profile <ExternalLink className="size-3" />
            </Link>
          ) : null}
        </motion.div>

        <motion.form onSubmit={save} {...pageMotion} transition={{ ...pageMotion.transition, delay: 0.08 }} className="mt-10 space-y-4">
          <GlassCard className="flex items-center gap-4 p-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="size-14 rounded-full border border-white/15 object-cover" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-full bg-white text-xl text-black">{letter}</span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-white/75">{user?.email}</p>
              <p className="t-caption mt-1">Your login email · managed by Supabase Auth</p>
            </div>
          </GlassCard>

          <GlassCard className="space-y-5 p-6">
            <SectionHeader icon={UserRound} label="Identity" />
            <GlassField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How should KOVA call you?" />
            <GlassField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="your_username"
            />
            <GlassField label="Profile picture URL" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" type="url" />
            <GlassTextarea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A little about your training" />
            <div className="grid gap-5 sm:grid-cols-2">
              <GlassField label="Fitness goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Build muscle" />
              <GlassField label="Training experience" value={level} onChange={(event) => setLevel(event.target.value)} placeholder="e.g. Beginner" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionHeader icon={Lock} label="Visibility" />
            <div className="mt-2 divide-y divide-white/[0.07]">
              <ToggleRow
                label="Public profile"
                description="Let athletes search for you, follow you and see your shared plans and sessions."
                checked={isPublic}
                onChange={setIsPublic}
              />
            </div>
          </GlassCard>

          <div className="flex items-center gap-4">
            <GlassButton type="submit" variant="solid" busy={saving} disabled={isLoading}>
              {!saving ? <Save className="size-4" /> : null}
              Save profile
            </GlassButton>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {saved ? (
              <p className="flex items-center gap-2 text-sm text-white/60">
                <Check className="size-4" /> Profile saved.
              </p>
            ) : null}
          </div>
        </motion.form>
      </div>
    </AppShell>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <GlassCard className="p-6">
        <SectionHeader icon={icon} label={title} />
        <p className="t-caption mt-2 max-w-xl leading-6">{description}</p>
        <div className="mt-5">{children}</div>
      </GlassCard>
    </motion.div>
  );
}

export function Settings() {
  const { user } = useSupabaseAuth();
  const { profile, update } = useKovaProfile(user?.id);
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
    setGym(
      profile.gym_name && profile.gym_lat != null && profile.gym_lng != null
        ? {
            name: profile.gym_name,
            lat: profile.gym_lat,
            lng: profile.gym_lng,
            osmType: (profile.gym_osm_type as GymLocation["osmType"]) ?? undefined,
            osmId: profile.gym_osm_id ?? undefined,
            openingHours: profile.gym_opening_hours ?? null,
          }
        : null,
    );
  }, [profile]);

  const saveGym = async (location: GymLocation) => {
    setSavingGym(true);
    setGymError("");
    try {
      await update({
        gym_name: location.name,
        gym_lat: location.lat,
        gym_lng: location.lng,
        gym_osm_type: location.osmType ?? null,
        gym_osm_id: location.osmId ?? null,
        gym_opening_hours: location.openingHours ?? null,
      });
      setGym(location);
      setGymSaved(true);
      window.setTimeout(() => setGymSaved(false), 2500);
    } catch (cause) {
      setGymError(cause instanceof Error ? cause.message : "Could not save your gym.");
    } finally {
      setSavingGym(false);
    }
  };

  const removeGym = async () => {
    setSavingGym(true);
    setGymError("");
    try {
      await update({ gym_name: null, gym_lat: null, gym_lng: null, gym_osm_type: null, gym_osm_id: null, gym_opening_hours: null });
      setGym(null);
      setGymSaved(false);
    } catch (cause) {
      setGymError(cause instanceof Error ? cause.message : "Could not remove your gym.");
    } finally {
      setSavingGym(false);
    }
  };

  const changeNotifications = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem("kova-notifications", value ? "on" : "off");
  };
  const changeReminders = (value: boolean) => {
    setReminders(value);
    localStorage.setItem("kova-reminders", value ? "on" : "off");
  };
  const updatePrivacy = async (value: boolean) => {
    if (profile) await update({ is_public: value });
  };
  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setPasswordError("");
    setPasswordMessage("");
    if (password.length < 6) {
      setPasswordError("Use at least 6 characters.");
      setBusy(false);
      return;
    }
    if (!supabase) {
      setPasswordError("Supabase is not configured.");
      setBusy(false);
      return;
    }
    const result = await supabase.auth.updateUser({ password });
    if (result.error) setPasswordError(result.error.message);
    else {
      setPassword("");
      setPasswordMessage("Password updated.");
    }
    setBusy(false);
  };

  return (
    <AppShell>
      <Seo title="Settings — KOVA AI" description="Manage your KOVA AI app settings." path="/dashboard/settings" />
      <div className="mx-auto max-w-3xl">
        <motion.div {...pageMotion}>
          <p className="t-label">Workspace</p>
          <h1 className="t-display mt-4">Settings.</h1>
          <p className="t-body mt-4 max-w-xl">A calm place to tune KOVA to the way you train and live.</p>
        </motion.div>

        <div className="mt-10 space-y-4">
          <SettingsSection icon={UserRound} title="Account" description="Your name, email and public profile." delay={0.05}>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="min-w-0">
                <p className="truncate text-sm text-white/75">{profile?.display_name || user?.email}</p>
                <p className="t-caption mt-1 truncate">{user?.email}</p>
              </div>
              <Link to="/dashboard/profile" className="glass-chip h-9 px-4 text-xs">
                Edit profile <ExternalLink className="size-3" />
              </Link>
            </div>
          </SettingsSection>

          <SettingsSection icon={CheckCircle2} title="Appearance" description="Pick the surface KOVA lives on. Saved on this device and restored on your next visit." delay={0.08}>
            <ThemeSwitch className="w-full max-w-sm [&>button]:flex-1" />
          </SettingsSection>

          <SettingsSection icon={Bell} title="Notifications" description="Preferences are saved on this device until notification delivery is connected." delay={0.11}>
            <div className="divide-y divide-white/[0.07]">
              <ToggleRow label="KOVA notifications" description="Allow this device to show KOVA updates." checked={notifications} onChange={changeNotifications} />
              <ToggleRow label="Workout reminders" description="Keep reminders ready for when scheduling is connected." checked={reminders} onChange={changeReminders} />
            </div>
          </SettingsSection>

          <SettingsSection icon={Lock} title="Privacy" description="Control whether your profile can be discovered by others." delay={0.14}>
            <ToggleRow
              label="Public profile"
              description="Let athletes search for you, follow you and see your shared plans and sessions."
              checked={profile?.is_public ?? false}
              onChange={(value) => void updatePrivacy(value)}
            />
          </SettingsSection>

          <SettingsSection icon={MapPin} title="Gym" description="Pick the gym you train at. The live map finds real gyms near you — search, drop a pin or use your location." delay={0.17}>
            {gym && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-white/70">
                    <MapPin className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/80">{gym.name}</p>
                    <p className="t-caption mt-0.5">
                      {gym.lat.toFixed(5)}, {gym.lng.toFixed(5)}
                    </p>
                    {gym.openingHours
                      ? (() => {
                          const status = gymStatus(gym.openingHours, new Date());
                          return (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                              <span
                                className={`size-1.5 rounded-full ${
                                  status.state === "open" ? "bg-emerald-300" : status.state === "closed" ? "bg-rose-300" : "bg-white/40"
                                }`}
                              />
                              {status.statusLabel}
                              {status.nextChange ? ` · ${status.nextChange}` : ""}
                            </p>
                          );
                        })()
                      : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-chip h-9 px-3.5 text-xs"
                  >
                    Directions <Navigation className="size-3" />
                  </a>
                  <button type="button" onClick={() => void removeGym()} disabled={savingGym} className="glass-chip h-9 px-3.5 text-xs disabled:opacity-50">
                    <Trash2 className="size-3" /> Remove
                  </button>
                </div>
              </div>
            )}
            <GymMapPicker value={gym} onChange={(location) => void saveGym(location)} saving={savingGym} />
            {gymSaved ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-white/60">
                <Check className="size-4" /> Gym saved.
              </p>
            ) : null}
            {gymError ? <p className="mt-3 text-sm text-red-300">{gymError}</p> : null}
          </SettingsSection>

          <SettingsSection icon={Lock} title="Security" description="Change your password for this KOVA account." delay={0.2}>
            <form onSubmit={updatePassword} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                className="glass-field h-11 flex-1 px-4 text-sm"
              />
              <GlassButton type="submit" variant="solid" busy={busy} className="sm:w-52">
                {!busy ? <CheckCircle2 className="size-4" /> : null}
                Update password
              </GlassButton>
            </form>
            {passwordError ? <p className="mt-3 text-sm text-red-300">{passwordError}</p> : null}
            {passwordMessage ? <p className="mt-3 text-sm text-white/60">{passwordMessage}</p> : null}
          </SettingsSection>

          <SettingsSection icon={CreditCard} title="Subscription" description="Billing becomes available when a verified subscription is connected." delay={0.23}>
            <Link to="/dashboard/upgrade" className="glass-chip h-9 px-4 text-xs">
              View plans <ExternalLink className="size-3" />
            </Link>
          </SettingsSection>
        </div>
      </div>
    </AppShell>
  );
}

export function Upgrade() {
  return (
    <AppShell>
      <Seo title="Upgrade — KOVA AI" description="KOVA AI plans and subscription options." path="/dashboard/upgrade" />
      <div className="mx-auto max-w-5xl">
        <motion.div {...pageMotion}>
          <p className="t-label">KOVA membership</p>
          <h1 className="t-display mt-4">Upgrade.</h1>
          <p className="t-body mt-4 max-w-xl">
            Choose the level of coaching that fits you. Subscription status and payments will only
            appear here once they are connected to a verified billing account.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Free", "Pro", "Max"].map((name, index) => (
            <motion.div key={name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.06 }}>
              <GlassCard interactive className="h-full p-6">
                <p className="t-label">KOVA</p>
                <h2 className="t-h1 mt-8">{name}</h2>
                <p className="t-body mt-4">Plan details will be shown from the connected billing provider.</p>
                <span className="t-caption mt-8 inline-flex items-center gap-2 text-white/35">
                  Not active <ExternalLink className="size-3" />
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
