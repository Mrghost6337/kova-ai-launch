-- KOVA AI web app foundation
-- Run this in Supabase SQL Editor before using the app.

create extension if not exists pgcrypto;

-- Gym selection: the live map gym picker stores the athlete's gym on the profile.
-- Safe to rerun; new columns are simply added if missing.
alter table public.profiles add column if not exists gym_name text;
alter table public.profiles add column if not exists gym_lat double precision;
alter table public.profiles add column if not exists gym_lng double precision;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  fitness_goal text,
  training_level text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text not null check (source in ('ai', 'manual')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  onboarding_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  title text not null,
  is_rest_day boolean not null default false,
  duration_minutes integer,
  notes text
);

create table if not exists public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  sort_order integer not null default 0,
  sets integer not null default 3,
  reps text not null default '8-12',
  rest_seconds integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.completed_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_exercise_id uuid not null references public.plan_exercises(id) on delete cascade,
  set_number integer not null,
  weight numeric,
  reps integer,
  effort numeric,
  completed_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  event_type text not null check (event_type in ('workout', 'rest', 'other')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists plan_days_plan_id_idx on public.plan_days(plan_id);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists plan_exercises_plan_day_id_idx on public.plan_exercises(plan_day_id);
create index if not exists completed_sets_user_id_idx on public.completed_sets(user_id);
create index if not exists public_profiles_username_idx on public.profiles(username) where is_public = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.calendar_events enable row level security;
alter table public.plan_exercises enable row level security;
alter table public.completed_sets enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Anyone can read public profiles" on public.profiles;
create policy "Anyone can read public profiles" on public.profiles for select using (is_public = true);

drop policy if exists "Users can manage own plans" on public.plans;
create policy "Users can manage own plans" on public.plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage days in own plans" on public.plan_days;
create policy "Users can manage days in own plans" on public.plan_days for all using (
  exists (select 1 from public.plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid())
) with check (
  exists (select 1 from public.plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid())
);
drop policy if exists "Users can manage own calendar events" on public.calendar_events;
create policy "Users can manage own calendar events" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage exercises in own plan days" on public.plan_exercises;
create policy "Users can manage exercises in own plan days" on public.plan_exercises for all using (
  exists (select 1 from public.plan_days join public.plans on plans.id = plan_days.plan_id where plan_days.id = plan_exercises.plan_day_id and plans.user_id = auth.uid())
) with check (
  exists (select 1 from public.plan_days join public.plans on plans.id = plan_days.plan_id where plan_days.id = plan_exercises.plan_day_id and plans.user_id = auth.uid())
);
drop policy if exists "Users can manage own completed sets" on public.completed_sets;
create policy "Users can manage own completed sets" on public.completed_sets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Social layer for public profiles, follows, workout sessions, likes and direct messages.
-- Safe to run after the original KOVA schema; every statement is idempotent.
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.session_likes (
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists workout_sessions_user_id_idx on public.workout_sessions(user_id, completed_at desc);
create index if not exists session_likes_user_id_idx on public.session_likes(user_id);
create index if not exists direct_messages_recipient_id_idx on public.direct_messages(recipient_id, created_at desc);

alter table public.follows enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_likes enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "Users can manage own follows" on public.follows;
create policy "Users can manage own follows" on public.follows for all using (auth.uid() = follower_id or auth.uid() = following_id) with check (auth.uid() = follower_id);
drop policy if exists "Anyone can read follows for public profiles" on public.follows;
create policy "Anyone can read follows for public profiles" on public.follows for select using (
  exists (select 1 from public.profiles where profiles.id = follows.following_id and profiles.is_public = true)
);

drop policy if exists "Public profiles can show sessions" on public.workout_sessions;
create policy "Public profiles can show sessions" on public.workout_sessions for select using (
  auth.uid() = user_id or exists (select 1 from public.profiles where profiles.id = workout_sessions.user_id and profiles.is_public = true)
);
drop policy if exists "Users can create own sessions" on public.workout_sessions;
create policy "Users can create own sessions" on public.workout_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own sessions" on public.workout_sessions;
create policy "Users can update own sessions" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own sessions" on public.workout_sessions;
create policy "Users can delete own sessions" on public.workout_sessions for delete using (auth.uid() = user_id);

drop policy if exists "Anyone can read likes on public sessions" on public.session_likes;
create policy "Anyone can read likes on public sessions" on public.session_likes for select using (
  exists (select 1 from public.workout_sessions join public.profiles on profiles.id = workout_sessions.user_id where workout_sessions.id = session_likes.session_id and (workout_sessions.user_id = auth.uid() or profiles.is_public = true))
);
drop policy if exists "Users can manage own likes" on public.session_likes;
create policy "Users can manage own likes" on public.session_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can remove own likes" on public.session_likes;
create policy "Users can remove own likes" on public.session_likes for delete using (auth.uid() = user_id);

drop policy if exists "Users can read own messages" on public.direct_messages;
create policy "Users can read own messages" on public.direct_messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Users can send messages" on public.direct_messages;
create policy "Users can send messages" on public.direct_messages for insert with check (auth.uid() = sender_id);
drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read" on public.direct_messages for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Plan sharing: a public flag on plans plus read policies so shared plans can be
-- viewed by any signed-in athlete (read-only for non-owners). Idempotent.
alter table public.plans add column if not exists is_public boolean not null default false;

create index if not exists public_plans_user_idx on public.plans(user_id) where is_public = true;

drop policy if exists "Anyone can read public plans" on public.plans;
create policy "Anyone can read public plans" on public.plans for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "Anyone can read days of public plans" on public.plan_days;
create policy "Anyone can read days of public plans" on public.plan_days for select using (
  exists (select 1 from public.plans where plans.id = plan_days.plan_id and (plans.is_public = true or plans.user_id = auth.uid()))
);

drop policy if exists "Anyone can read exercises of public plans" on public.plan_exercises;
create policy "Anyone can read exercises of public plans" on public.plan_exercises for select using (
  exists (
    select 1 from public.plan_days
    join public.plans on plans.id = plan_days.plan_id
    where plan_days.id = plan_exercises.plan_day_id
      and (plans.is_public = true or plans.user_id = auth.uid())
  )
);
