# Supabase setup for the KOVA web app

The new web app uses Supabase for authentication and private app data. The existing Convex integration remains in place for the public waitlist and existing Stripe functions.

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). In **Project Settings → API**, copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable/anon key** → `VITE_SUPABASE_ANON_KEY`

Never put a Supabase service-role key in the browser or in `VITE_*` variables.

## 2. Configure Auth

In **Authentication → Providers**:

- Enable **Email**.
- Decide whether email confirmation is required for launch.
- Enable **Google** and add the Google OAuth client ID/secret supplied by Google Cloud.

In **Authentication → URL Configuration**, set:

- Site URL: `https://kovaai.dev`
- Redirect URL: `https://kovaai.dev/dashboard`
- Local redirect URL while developing: `http://localhost:5173/dashboard`

## 3. Create tables and security policies

Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).

The migration creates:

- `profiles`
- `plans`
- `plan_days`
- `calendar_events`
- profile creation on new auth users
- Row Level Security policies so private rows belong to the signed-in user

Do not disable RLS. Public profile visibility is deliberately limited to rows where `profiles.is_public = true`.

The latest [`supabase/schema.sql`](supabase/schema.sql) also includes the social layer (`follows`, `workout_sessions`, `session_likes`, `direct_messages`), plan sharing (`plans.is_public` plus public-read policies on `plans`, `plan_days` and `plan_exercises`), the **Social v2** block (`posts`, `post_likes`, `plan_shares` with RLS for the new Social page) and the gym columns (`profiles.gym_name`, `gym_lat`, `gym_lng`, `gym_osm_type`, `gym_osm_id`, `gym_opening_hours`) used by the live-map gym picker and the open/closed gym widget. Rerunning the whole file is safe — every statement is idempotent. If you already ran an older version, run the file once more (or just the missing blocks: "Plan sharing", "Social v2" and the gym columns) so Share, the Social page and the gym picker work.

## 4. Add Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add these for **Production, Preview, and Development** as appropriate:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Keep the existing `VITE_CONVEX_URL` variable until the waitlist and Stripe functions have been migrated separately.

After changing environment variables, redeploy. Vite embeds `VITE_*` values at build time.

## Current implementation scope

Available now:

- Persistent Supabase email/password sessions
- Email sign-in and sign-up
- Google OAuth redirect flow
- Sign-out
- Protected app shell
- Real profile persistence
- Real plan draft persistence
- Honest empty states when no workouts, progress, food, gym or subscription data exists
- Lazy exercise catalog search with remote demonstrations

The app intentionally does not invent gyms, opening hours, workout history, nutrition targets, progress, payment state or AI-generated plans. Those require their provider/API configuration and backend workflows to be connected first.

## Production values confirmed

The production Supabase project is `https://qcqcteefhpwgwoniqvpm.supabase.co` and the production web origin is `https://kovaai.dev`. Keep the publishable/anon key only in Vercel's `VITE_SUPABASE_ANON_KEY` variable; never commit it to the repository. Google OAuth's provider credentials stay in Supabase, while Google's authorized callback is `https://qcqcteefhpwgwoniqvpm.supabase.co/auth/v1/callback`.
