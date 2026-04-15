-- RLS — tables cockpit (admin uniquement)
-- Exécuter APRÈS migration_cockpit.sql

alter table public.business_settings enable row level security;
alter table public.financial_goals enable row level security;
alter table public.ledger_categories enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.saved_places enable row level security;
alter table public.internal_documents enable row level security;
alter table public.work_priorities enable row level security;
alter table public.lead_activities enable row level security;

-- business_settings
create policy "business_settings_admin_all"
  on public.business_settings for all
  using (is_admin())
  with check (is_admin());

-- financial_goals
create policy "financial_goals_admin_all"
  on public.financial_goals for all
  using (is_admin())
  with check (is_admin());

-- ledger_categories
create policy "ledger_categories_admin_all"
  on public.ledger_categories for all
  using (is_admin())
  with check (is_admin());

-- ledger_transactions
create policy "ledger_transactions_admin_all"
  on public.ledger_transactions for all
  using (is_admin())
  with check (is_admin());

-- projects
create policy "projects_admin_all"
  on public.projects for all
  using (is_admin())
  with check (is_admin());

-- invoices
create policy "invoices_admin_all"
  on public.invoices for all
  using (is_admin())
  with check (is_admin());

-- saved_places
create policy "saved_places_admin_all"
  on public.saved_places for all
  using (is_admin())
  with check (is_admin());

-- internal_documents
create policy "internal_documents_admin_all"
  on public.internal_documents for all
  using (is_admin())
  with check (is_admin());

-- work_priorities
create policy "work_priorities_admin_all"
  on public.work_priorities for all
  using (is_admin())
  with check (is_admin());

-- lead_activities
create policy "lead_activities_admin_all"
  on public.lead_activities for all
  using (is_admin())
  with check (is_admin());
