create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  number text not null,
  issue_date date not null default now(),
  due_date date,
  subtotal_cents int not null default 0,
  tax_rate numeric not null default 0,
  total_cents int not null default 0,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  qty int not null default 1,
  unit_price_cents int not null default 0,
  total_cents int not null default 0
);

-- RLS
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Accès membres du workspace
create policy "members rdw invoices" on public.invoices
for select using (
  exists(select 1 from public.workspace_members m
         where m.workspace_id = invoices.workspace_id and m.user_id = auth.uid())
);
create policy "members crud invoices" on public.invoices
for all using (
  exists(select 1 from public.workspace_members m
         where m.workspace_id = invoices.workspace_id and m.user_id = auth.uid())
) with check (
  exists(select 1 from public.workspace_members m
         where m.workspace_id = invoices.workspace_id and m.user_id = auth.uid())
);

create policy "members rdw items" on public.invoice_items
for select using (
  exists(
    select 1 from public.invoices i
    join public.workspace_members m on m.workspace_id = i.workspace_id
    where i.id = invoice_items.invoice_id and m.user_id = auth.uid()
  )
);
create policy "members crud items" on public.invoice_items
for all using (
  exists(
    select 1 from public.invoices i
    join public.workspace_members m on m.workspace_id = i.workspace_id
    where i.id = invoice_items.invoice_id and m.user_id = auth.uid()
  )
) with check (true);
