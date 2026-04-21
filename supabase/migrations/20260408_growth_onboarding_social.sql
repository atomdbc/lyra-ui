alter table public.workspace_users
add column if not exists has_seen_terminal_onboarding boolean not null default false,
add column if not exists username text,
add column if not exists avatar_url text,
add column if not exists profile_visibility text not null default 'public',
add column if not exists public_trade_feed_opt_in boolean not null default true;

alter table public.workspace_users
drop constraint if exists workspace_users_profile_visibility_check;

alter table public.workspace_users
add constraint workspace_users_profile_visibility_check
check (profile_visibility in ('public', 'private'));

create unique index if not exists workspace_users_username_key
  on public.workspace_users (lower(username))
  where username is not null;

alter table public.paper_trades
add column if not exists user_note text,
add column if not exists strategy_tag text,
add column if not exists planned_rr numeric(12,4);

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'mobile_holding',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));

create table if not exists public.share_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_user_id uuid not null references public.workspace_users(id) on delete cascade,
  type text not null check (type in ('session_pnl', 'trade_result')),
  theme text not null check (theme in ('mono', 'dark', 'grid')),
  payload jsonb not null default '{}'::jsonb,
  public_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists share_cards_workspace_user_id_idx
  on public.share_cards (workspace_user_id, created_at desc);

alter table public.waitlist_signups enable row level security;
alter table public.share_cards enable row level security;
