-- DeskFlow MVP schema: profiles, devices, device_states + RLS

-- Profiles (mirror auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Devices
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Aquarium Controller',
  device_key_hash text not null,
  key_created_at timestamptz not null default now(),
  key_last_used_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);

create index if not exists devices_user_id_idx on public.devices (user_id);

alter table public.devices enable row level security;

create policy "Users can select own devices"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "Users can insert own devices"
  on public.devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own devices"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own devices"
  on public.devices for delete
  using (auth.uid() = user_id);

-- Device states (desired vs reported)
create table if not exists public.device_states (
  device_id uuid primary key references public.devices (id) on delete cascade,
  desired_light_on boolean not null default false,
  desired_filter_on boolean not null default false,
  reported_light_on boolean not null default false,
  reported_filter_on boolean not null default false,
  updated_at timestamptz not null default now(),
  reported_at timestamptz
);

alter table public.device_states enable row level security;

create policy "Users can select own device states"
  on public.device_states for select
  using (
    exists (
      select 1 from public.devices d
      where d.id = device_states.device_id and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own device states"
  on public.device_states for insert
  with check (
    exists (
      select 1 from public.devices d
      where d.id = device_states.device_id and d.user_id = auth.uid()
    )
  );

create policy "Users can update own device states"
  on public.device_states for update
  using (
    exists (
      select 1 from public.devices d
      where d.id = device_states.device_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.devices d
      where d.id = device_states.device_id and d.user_id = auth.uid()
    )
  );

-- Keep updated_at fresh when desired fields change
create or replace function public.touch_device_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists device_states_touch_updated_at on public.device_states;
create trigger device_states_touch_updated_at
  before update on public.device_states
  for each row execute function public.touch_device_state_updated_at();
