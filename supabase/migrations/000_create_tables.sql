create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  plan text default 'starter',
  sms_quota_month integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','practitioner','staff')),
  created_at timestamptz default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  timezone text default 'Europe/Paris',
  reminder_email_j_1 boolean default true,
  reminder_sms_h_3 boolean default false,
  invoice_prefix text default 'INV-',
  created_at timestamptz default now()
);
