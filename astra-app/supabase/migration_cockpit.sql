-- Astra Studio — Cockpit business (V1)
-- Exécuter APRÈS migration.sql sur le projet Supabase.

-- ------------------------------------------------------------
-- Extensions colonnes CRM (leads)
-- ------------------------------------------------------------
alter table public.leads
  add column if not exists heat text default 'warm'
    check (heat in ('cold', 'warm', 'hot'));
alter table public.leads
  add column if not exists potential_value numeric(12,2);
alter table public.leads
  add column if not exists tags text[] default '{}';
alter table public.leads
  add column if not exists converted_client_id uuid references public.clients(id) on delete set null;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
do $$ begin
  create type goal_period as enum ('month', 'quarter', 'year');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_kind as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_payment_status as enum ('pending', 'paid', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('planned', 'active', 'blocked', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_item_status as enum ('open', 'done', 'dismissed');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- business_settings (singleton)
-- ------------------------------------------------------------
create table if not exists public.business_settings (
  id smallint primary key default 1 check (id = 1),
  company_legal_name text,
  company_address text,
  default_tax_rate numeric(5,2) not null default 20,
  invoice_prefix text not null default 'FAC',
  quote_prefix text not null default 'DEV',
  invoice_seq int not null default 0,
  default_monthly_goal numeric(12,2),
  sender_email text,
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- financial_goals
-- ------------------------------------------------------------
create table if not exists public.financial_goals (
  id uuid primary key default uuid_generate_v4(),
  period_type goal_period not null,
  period_start date not null,
  target_amount numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (period_type, period_start)
);

-- ------------------------------------------------------------
-- ledger_categories
-- ------------------------------------------------------------
create table if not exists public.ledger_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  kind ledger_kind not null,
  parent_id uuid references public.ledger_categories(id) on delete set null,
  sort_order int not null default 0
);

-- ------------------------------------------------------------
-- ledger_transactions
-- ------------------------------------------------------------
create table if not exists public.ledger_transactions (
  id uuid primary key default uuid_generate_v4(),
  kind ledger_kind not null,
  amount numeric(12,2) not null check (amount >= 0),
  category_id uuid references public.ledger_categories(id) on delete set null,
  subcategory text,
  status ledger_payment_status not null default 'paid',
  payment_method text,
  occurred_on date not null,
  description text,
  notes text,
  attachment_url text,
  client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ledger_occurred on public.ledger_transactions (occurred_on);
create index if not exists idx_ledger_kind on public.ledger_transactions (kind);

-- ------------------------------------------------------------
-- projects
-- ------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  status project_status not null default 'planned',
  priority project_priority not null default 'medium',
  deadline date,
  progress smallint not null default 0 check (progress >= 0 and progress <= 100),
  checklist jsonb not null default '[]'::jsonb,
  deliverables text,
  notes text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_status on public.projects (status);
create index if not exists idx_projects_client on public.projects (client_id);

-- ------------------------------------------------------------
-- invoices (factures — distinct des devis / quotes)
-- ------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null,
  tax_rate numeric(5,2) not null default 20,
  total numeric(12,2) not null,
  status invoice_status not null default 'draft',
  issued_at date,
  due_at date,
  paid_at date,
  notes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoices_client on public.invoices (client_id);

-- ------------------------------------------------------------
-- saved_places (repères terrain)
-- ------------------------------------------------------------
create table if not exists public.saved_places (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- internal_documents
-- ------------------------------------------------------------
create table if not exists public.internal_documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text,
  file_url text,
  storage_path text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- work_priorities (priorités du moment)
-- ------------------------------------------------------------
create table if not exists public.work_priorities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  due_date date,
  status priority_item_status not null default 'open',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- lead_activities (historique CRM)
-- ------------------------------------------------------------
create table if not exists public.lead_activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type text not null,
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_lead_activities_lead on public.lead_activities (lead_id);

-- ------------------------------------------------------------
-- Triggers updated_at
-- ------------------------------------------------------------
drop trigger if exists trg_ledger_tx_updated_at on public.ledger_transactions;
create trigger trg_ledger_tx_updated_at
  before update on public.ledger_transactions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Catégories comptables par défaut (une seule fois si table vide)
-- ------------------------------------------------------------
insert into public.ledger_categories (name, kind, sort_order)
select v.name, v.k::ledger_kind, v.ord
from (
  values
    ('Prestations & missions', 'income', 1),
    ('Abonnements / récurrent', 'income', 2),
    ('Autres recettes', 'income', 3),
    ('Outils & logiciels', 'expense', 1),
    ('Marketing & pub', 'expense', 2),
    ('Déplacements', 'expense', 3),
    ('Freelances & sous-traitance', 'expense', 4),
    ('Charges & divers', 'expense', 5)
) as v(name, k, ord)
where not exists (select 1 from public.ledger_categories);
