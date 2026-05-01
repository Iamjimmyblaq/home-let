
-- ROLES
create type public.app_role as enum ('user', 'agent', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.get_my_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = auth.uid() order by
    case role when 'admin' then 1 when 'agent' then 2 else 3 end limit 1
$$;

create policy "view own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  agency_name text,
  bio text,
  kyc_status text not null default 'none', -- none | pending | verified | rejected
  kyc_doc_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles readable by all auth" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "admins manage profiles" on public.profiles for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- TIMESTAMP TRIGGER
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger update_profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- WALLETS
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  available_balance bigint not null default 0,
  escrow_balance bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy "view own wallet" on public.wallets for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "users update own wallet" on public.wallets for update using (auth.uid() = user_id);
create policy "users insert own wallet" on public.wallets for insert with check (auth.uid() = user_id);

create trigger update_wallets_updated_at before update on public.wallets
for each row execute function public.update_updated_at_column();

-- TRANSACTIONS
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- fund | escrow_hold | escrow_release | refund | payout
  amount bigint not null,
  description text,
  reference_id uuid,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "view own transactions" on public.transactions for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);

-- LISTINGS
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  type text not null, -- rent | sale | shortlet
  category text, -- apartment | house | duplex | land | commercial
  price bigint not null,
  bedrooms int default 0,
  bathrooms int default 0,
  area_sqm int,
  location text not null,
  city text,
  state text,
  amenities text[] default '{}',
  images text[] default '{}',
  tour_url text,
  status text not null default 'pending', -- pending | verified | rejected | inactive
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.listings enable row level security;
create policy "verified listings visible to all" on public.listings for select using (status = 'verified' or agent_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "agents create listings" on public.listings for insert with check (auth.uid() = agent_id and (public.has_role(auth.uid(),'agent') or public.has_role(auth.uid(),'admin')));
create policy "agents update own listings" on public.listings for update using (auth.uid() = agent_id or public.has_role(auth.uid(),'admin'));
create policy "agents delete own listings" on public.listings for delete using (auth.uid() = agent_id or public.has_role(auth.uid(),'admin'));

create trigger update_listings_updated_at before update on public.listings
for each row execute function public.update_updated_at_column();
create index idx_listings_status on public.listings(status);
create index idx_listings_type on public.listings(type);

-- INSPECTIONS
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references auth.users(id) on delete cascade,
  mode text not null, -- virtual | physical
  scheduled_at timestamptz not null,
  fee bigint not null,
  status text not null default 'pending', -- pending | confirmed | completed | cancelled
  notes text,
  created_at timestamptz not null default now()
);
alter table public.inspections enable row level security;
create policy "view own inspections" on public.inspections for select using (auth.uid() in (user_id, agent_id) or public.has_role(auth.uid(),'admin'));
create policy "users create inspections" on public.inspections for insert with check (auth.uid() = user_id);
create policy "parties update inspections" on public.inspections for update using (auth.uid() in (user_id, agent_id) or public.has_role(auth.uid(),'admin'));

-- BOOKINGS (short-let / hotel)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  hotel_ref text, -- for seeded hotels
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid references auth.users(id) on delete set null,
  check_in date not null,
  check_out date not null,
  guests int not null default 1,
  total_amount bigint not null,
  status text not null default 'pending', -- pending | confirmed | completed | cancelled
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
create policy "view own bookings" on public.bookings for select using (auth.uid() = user_id or auth.uid() = agent_id or public.has_role(auth.uid(),'admin'));
create policy "users create bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "parties update bookings" on public.bookings for update using (auth.uid() in (user_id, agent_id) or public.has_role(auth.uid(),'admin'));

-- FAVORITES
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "view own favorites" on public.favorites for select using (auth.uid() = user_id);
create policy "manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHAT
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique (user_id, agent_id, listing_id)
);
alter table public.chat_threads enable row level security;
create policy "view own threads" on public.chat_threads for select using (auth.uid() in (user_id, agent_id) or public.has_role(auth.uid(),'admin'));
create policy "create threads" on public.chat_threads for insert with check (auth.uid() in (user_id, agent_id));
create policy "update own threads" on public.chat_threads for update using (auth.uid() in (user_id, agent_id));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "view messages of own threads" on public.messages for select using (
  exists (select 1 from public.chat_threads t where t.id = thread_id and auth.uid() in (t.user_id, t.agent_id))
  or public.has_role(auth.uid(),'admin')
);
create policy "send messages in own threads" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.chat_threads t where t.id = thread_id and auth.uid() in (t.user_id, t.agent_id)
  )
);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_threads;

-- AUTO-CREATE PROFILE / ROLE / WALLET ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  chosen_role app_role;
begin
  chosen_role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'user');

  insert into public.profiles (user_id, full_name, phone, agency_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'agency_name'
  );

  insert into public.user_roles (user_id, role) values (new.id, chosen_role)
  on conflict do nothing;

  insert into public.wallets (user_id, available_balance, escrow_balance)
  values (new.id, 0, 0) on conflict do nothing;

  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
