-- KOVA AI web app foundation
-- Run this in Supabase SQL Editor before using the app.

create extension if not exists pgcrypto;

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

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Anyone can read public profiles" on public.profiles;
create policy "Anyone can read public profiles" on public.profiles for select using (is_public = true);

create policy "Users can manage own plans" on public.plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage days in own plans" on public.plan_days for all using (
  exists (select 1 from public.plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid())
) with check (
  exists (select 1 from public.plans where plans.id = plan_days.plan_id and plans.user_id = auth.uid())
);
create policy "Users can manage own calendar events" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
