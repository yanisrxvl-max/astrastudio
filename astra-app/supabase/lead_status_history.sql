-- Historique des changements de statut sur les leads (exécuter après migration.sql + rls_policies.sql)

create table if not exists public.lead_status_history (
  id uuid primary key default uuid_generate_v4 (),
  lead_id uuid not null references public.leads (id) on delete cascade,
  previous_status text,
  new_status text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_lead_status_history_lead
  on public.lead_status_history (lead_id, created_at desc);

alter table public.lead_status_history enable row level security;

create policy "lead_status_history_admin_all"
  on public.lead_status_history for all
  using (public.is_admin ())
  with check (public.is_admin ());
