
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- incidents
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  incident_type text not null,
  severity text not null check (severity in ('Low','Medium','High')),
  description text not null,
  photo_url text,
  latitude float8 not null,
  longitude float8 not null,
  status text not null default 'Pending' check (status in ('Pending','Verified','Resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incidents enable row level security;

create policy "Incidents are viewable by everyone"
  on public.incidents for select using (true);

create policy "Authenticated users can insert their own incidents"
  on public.incidents for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own incidents"
  on public.incidents for update to authenticated using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();
