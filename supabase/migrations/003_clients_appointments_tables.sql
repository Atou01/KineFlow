create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  date timestamptz not null,
  duration_minutes int default 30,
  status text default 'planned' check (status in ('planned','done','cancelled')),
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.appointments enable row level security;

create policy "members rdw clients" on public.clients
for select using (exists (select 1 from public.workspace_members m where m.workspace_id = clients.workspace_id and m.user_id = auth.uid()));
create policy "members crud clients" on public.clients
for all using (exists (select 1 from public.workspace_members m where m.workspace_id = clients.workspace_id and m.user_id = auth.uid())) with check (true);

create policy "members rdw appointments" on public.appointments
for select using (exists (select 1 from public.workspace_members m where m.workspace_id = appointments.workspace_id and m.user_id = auth.uid()));
create policy "members crud appointments" on public.appointments
for all using (exists (select 1 from public.workspace_members m where m.workspace_id = appointments.workspace_id and m.user_id = auth.uid())) with check (true);
