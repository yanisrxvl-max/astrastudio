-- Suivi téléchargement côté client (statut pack « Téléchargé » quand tous les fichiers ont été marqués)
alter table public.content_files
  add column if not exists client_downloaded_at timestamptz;

comment on column public.content_files.client_downloaded_at is
  'Premier marquage « téléchargé » par le client (via app).';
