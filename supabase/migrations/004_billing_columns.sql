alter table public.workspaces
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan_status text default 'inactive', -- inactive | active | past_due | trialing | canceled
  add column if not exists grace_until timestamptz;

create index if not exists idx_workspaces_stripe_customer on public.workspaces (stripe_customer_id);
create index if not exists idx_workspaces_subscription on public.workspaces (stripe_subscription_id);
