-- Première ouverture du pack par le client (badge « Nouveau »)
alter table public.content_packs
  add column if not exists opened_at timestamptz;

comment on column public.content_packs.opened_at is 'Rempli lors de la première visite du pack par le client.';
