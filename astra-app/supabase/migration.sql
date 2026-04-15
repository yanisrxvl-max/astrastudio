-- =============================================================================
-- ASTRA Studio — Schéma complet (PostgreSQL / Supabase)
-- À exécuter dans le SQL Editor d'un projet Supabase vierge.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
create type user_role as enum ('admin', 'client');
create type lead_status as enum (
  'new',
  'contacted',
  'call_scheduled',
  'quoted',
  'converted',
  'lost'
);
create type client_offer as enum ('audit', 'monthly', 'custom');
create type client_status as enum ('active', 'paused', 'ended');
create type quote_status as enum (
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired'
);
create type pack_status as enum ('preparing', 'delivered', 'downloaded');
create type content_file_type as enum ('video', 'photo', 'document', 'other');
create type upload_file_type as enum ('brief', 'asset', 'photo', 'document', 'other');
create type notif_type as enum (
  'new_lead',
  'quote_accepted',
  'content_delivered',
  'file_uploaded',
  'message'
);

-- -----------------------------------------------------------------------------
-- profiles (1:1 avec auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  company_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default uuid_generate_v4 (),
  first_name text not null,
  email text not null,
  message text not null,
  budget_range text,
  source text,
  phone text,
  offer_interest text,
  status lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- clients
-- -----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default uuid_generate_v4 (),
  user_id uuid references auth.users (id) on delete set null,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  brand_url text,
  offer_type client_offer not null,
  monthly_price bigint,
  start_date date,
  status client_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- quotes (montants en centimes : subtotal, total)
-- -----------------------------------------------------------------------------
create table public.quotes (
  id uuid primary key default uuid_generate_v4 (),
  quote_number text not null unique,
  client_id uuid references public.clients (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  recipient_name text not null,
  recipient_email text not null,
  recipient_company text,
  items jsonb not null default '[]'::jsonb,
  subtotal bigint not null,
  tax_rate numeric(5, 2) not null default 0,
  total bigint not null,
  valid_until date not null,
  status quote_status not null default 'draft',
  notes text,
  pdf_url text,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- content_packs
-- -----------------------------------------------------------------------------
create table public.content_packs (
  id uuid primary key default uuid_generate_v4 (),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text,
  month text not null,
  status pack_status not null default 'preparing',
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- content_files
-- -----------------------------------------------------------------------------
create table public.content_files (
  id uuid primary key default uuid_generate_v4 (),
  pack_id uuid not null references public.content_packs (id) on delete cascade,
  file_name text not null,
  file_type content_file_type not null,
  file_size bigint not null,
  file_url text not null,
  thumbnail_url text,
  mime_type text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- client_uploads
-- -----------------------------------------------------------------------------
create table public.client_uploads (
  id uuid primary key default uuid_generate_v4 (),
  client_id uuid not null references public.clients (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_type upload_file_type not null,
  file_size bigint not null,
  file_url text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default uuid_generate_v4 (),
  user_id uuid not null references auth.users (id) on delete cascade,
  type notif_type not null,
  title text not null,
  body text,
  read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Index
-- -----------------------------------------------------------------------------
create index idx_leads_status on public.leads (status);
create index idx_leads_created_at on public.leads (created_at);
create index idx_clients_status on public.clients (status);
create index idx_clients_user_id on public.clients (user_id);
create index idx_quotes_status on public.quotes (status);
create index idx_quotes_client_id on public.quotes (client_id);
create index idx_quotes_recipient_email on public.quotes (recipient_email);
create index idx_content_packs_client_id on public.content_packs (client_id);
create index idx_content_packs_status on public.content_packs (status);
create index idx_content_files_pack_id on public.content_files (pack_id);
create index idx_client_uploads_client_id on public.client_uploads (client_id);
create index idx_notifications_user_read on public.notifications (user_id, read);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profil automatique à l'inscription
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
