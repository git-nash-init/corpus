-- Crorpus core schema. Applied to Supabase project qhvlhiboaknvqhkpqtfk on 2026-10-07.
-- Every user-owned table has row level security: a user can only see and change rows where user_id = auth.uid().

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles (one per auth user)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar text check (char_length(avatar) <= 300),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mutual funds
create table public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  category text not null check (category in ('Equity', 'Debt', 'Hybrid', 'Index', 'Other')),
  amfi_code text check (char_length(amfi_code) <= 20),
  sip_amount numeric(16,2) not null default 0 check (sip_amount >= 0),
  sip_day smallint not null default 10 check (sip_day between 1 and 28),
  sip_status text not null default 'Active' check (sip_status in ('Active', 'Paused', 'Stopped')),
  latest_nav numeric(20,6) not null check (latest_nav > 0),
  nav_date date not null default current_date,
  manual_value numeric(16,2) check (manual_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.fund_txns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fund_id uuid not null,
  date date not null,
  type text not null check (type in ('SIP', 'Lumpsum', 'Redemption')),
  amount numeric(16,2) not null check (amount > 0),
  nav numeric(20,6) not null check (nav > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The fund must belong to the same user as the transaction.
  foreign key (fund_id, user_id) references public.funds (id, user_id) on delete cascade
);

-- Stocks
create table public.stock_txns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ticker text not null check (ticker ~ '^[A-Z0-9&\-\.]{1,20}$'),
  date date not null,
  type text not null check (type in ('Buy', 'Sell')),
  quantity numeric(16,4) not null check (quantity > 0),
  price numeric(16,4) not null check (price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ticker text not null check (ticker ~ '^[A-Z0-9&\-\.]{1,20}$'),
  name text not null check (char_length(name) <= 200),
  sector text not null check (char_length(sector) <= 60),
  cmp numeric(16,4) not null check (cmp >= 0),
  as_of timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

-- Fixed income, retirement and commodities
create table public.fixed_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('PPF', 'EPF', 'NPS', 'FD', 'SGB', 'Gold', 'Silver')),
  name text not null check (char_length(name) between 1 and 200),
  provider text not null default '' check (char_length(provider) <= 200),
  invested numeric(16,2) not null default 0 check (invested >= 0),
  current_value numeric(16,2) not null default 0 check (current_value >= 0),
  annual_contribution numeric(16,2) not null default 0 check (annual_contribution >= 0),
  maturity text not null default '' check (char_length(maturity) <= 40),
  liquidity text not null check (liquidity in ('Locked', 'Semi-Liquid', 'Highly Liquid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Balance sheet
create table public.balance_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  kind text not null check (kind in ('Cash', 'RealEstate', 'Vehicle', 'Other')),
  value numeric(16,2) not null default 0 check (value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  lender text not null default '' check (char_length(lender) <= 200),
  outstanding numeric(16,2) not null default 0 check (outstanding >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target numeric(16,2) not null check (target > 0),
  target_date date not null,
  expected_return numeric(6,4) not null default 0.12 check (expected_return between 0 and 0.4),
  monthly_sip numeric(16,2) not null default 0 check (monthly_sip >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Monthly snapshots
create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  total_assets numeric(16,2) not null,
  total_liabilities numeric(16,2) not null,
  net_worth numeric(16,2) not null,
  investment_value numeric(16,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

-- Monthly review
create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position smallint not null default 0,
  action text not null check (char_length(action) between 1 and 200),
  timeline text not null default '' check (char_length(timeline) <= 60),
  focus text not null default '' check (char_length(focus) <= 120),
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.review_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('Key wins', 'Improvements', 'Next actions')),
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document vault metadata (files live in storage bucket "documents")
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 500),
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime text not null default 'application/octet-stream',
  size bigint not null check (size >= 0 and size <= 20971520),
  kind text not null default 'Other' check (kind in ('Statement', 'Contract note', 'FD receipt', 'Import', 'Other')),
  linked_type text check (linked_type in ('fund', 'stock', 'fixed_asset', 'liability', 'balance_asset')),
  linked_id text check (char_length(linked_id) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes, updated_at triggers, RLS and owner policies for every user table.
do $$
declare
  t text;
begin
  foreach t in array array['funds','fund_txns','stock_txns','stock_quotes','fixed_assets','balance_assets','liabilities','goals','snapshots','review_items','review_notes','documents']
  loop
    execute format('create index %I on public.%I (user_id)', t || '_user_id_idx', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Owner can read" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

create index fund_txns_fund_id_user_id_idx on public.fund_txns (fund_id, user_id);

create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;
create policy "Owner can read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Owner can update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- New user: profile row plus the default monthly review checklist.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));

  insert into public.review_items (user_id, position, action, timeline, focus) values
    (new.id, 1, 'Verify mutual fund SIP debits', '1st to 5th', 'SIP completed'),
    (new.id, 2, 'Refresh stock prices and valuations', '10th to 15th', 'Investments updated'),
    (new.id, 3, 'Log EPF, PPF and NPS balances', '15th to 20th', 'Other assets in sync'),
    (new.id, 4, 'Review EMI and debt reduction', '20th to 25th', 'Debt reduced'),
    (new.id, 5, 'Pay credit card statement in full', '25th', 'Zero penalty'),
    (new.id, 6, 'Check progress on the goal', '28th', 'Goal progress checked'),
    (new.id, 7, 'Take the month-end wealth snapshot', 'Last day', 'Snapshot logged');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: private buckets, each user confined to a folder named after their id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('documents', 'documents', false, 20971520, array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'
  ]),
  ('avatars', 'avatars', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']);

create policy "Owner reads own files" on storage.objects for select to authenticated
  using (bucket_id in ('documents', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owner uploads own files" on storage.objects for insert to authenticated
  with check (bucket_id in ('documents', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owner updates own files" on storage.objects for update to authenticated
  using (bucket_id in ('documents', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('documents', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owner deletes own files" on storage.objects for delete to authenticated
  using (bucket_id in ('documents', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
