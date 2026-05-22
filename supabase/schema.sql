-- ─── MentHabit — Supabase Schema ─────────────────────────────────────────────
-- Run this entire file in the Supabase SQL Editor (once, idempotent).
-- Tables: transactions, custom_habits, user_settings
-- All tables use RLS: each user only sees and mutates their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Shared trigger function ──────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. transactions
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id             uuid        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  date           text        not null,
  amount         numeric(12, 2) not null,
  type           text        not null check (type in ('income', 'expense')),
  concept        text        not null,
  classification text        not null,
  regularity     text        not null check (regularity in ('regular', 'no_regular', 'recurrente', 'eventual')),
  notes          text,
  habit_category text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: select own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions: insert own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions: update own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: delete own"
  on public.transactions for delete
  using (auth.uid() = user_id);

create or replace trigger transactions_updated_at
  before update on public.transactions
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. custom_habits
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.custom_habits (
  id           uuid        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  label        text        not null,
  emoji        text        not null,
  accent_color text        not null,
  bg_color     text        not null,
  border_color text        not null,
  type         text        not null check (type in ('expense', 'income', 'both')),
  description  text,
  archived     boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.custom_habits enable row level security;

create policy "custom_habits: select own"
  on public.custom_habits for select
  using (auth.uid() = user_id);

create policy "custom_habits: insert own"
  on public.custom_habits for insert
  with check (auth.uid() = user_id);

create policy "custom_habits: update own"
  on public.custom_habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "custom_habits: delete own"
  on public.custom_habits for delete
  using (auth.uid() = user_id);

create or replace trigger custom_habits_updated_at
  before update on public.custom_habits
  for each row execute function update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. user_settings  (one row per user, PK = user_id)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_settings (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  currency   text        not null default 'MXN $',
  user_name  text        not null default 'Usuario',
  language   text        not null default 'Spanish',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings: select own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings: insert own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings: update own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function update_updated_at_column();
