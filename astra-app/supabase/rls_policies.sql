-- =============================================================================
-- ASTRA Studio — Row Level Security (à exécuter après migration.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin()
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- leads (admin uniquement ; API publique utilise la service role)
-- -----------------------------------------------------------------------------
alter table public.leads enable row level security;

create policy "leads_select_admin"
  on public.leads for select
  using (public.is_admin());

create policy "leads_insert_admin"
  on public.leads for insert
  with check (public.is_admin());

create policy "leads_update_admin"
  on public.leads for update
  using (public.is_admin());

create policy "leads_delete_admin"
  on public.leads for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- clients
-- -----------------------------------------------------------------------------
alter table public.clients enable row level security;

create policy "clients_select_admin"
  on public.clients for select
  using (public.is_admin());

create policy "clients_select_own"
  on public.clients for select
  using (user_id = auth.uid());

create policy "clients_insert_admin"
  on public.clients for insert
  with check (public.is_admin());

create policy "clients_update_admin"
  on public.clients for update
  using (public.is_admin());

create policy "clients_delete_admin"
  on public.clients for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- quotes
-- -----------------------------------------------------------------------------
alter table public.quotes enable row level security;

create policy "quotes_select_admin"
  on public.quotes for select
  using (public.is_admin());

create policy "quotes_select_client_by_email"
  on public.quotes for select
  using (
    auth.uid() is not null
    and recipient_email = (auth.jwt() ->> 'email')
  );

create policy "quotes_select_client_by_client_id"
  on public.quotes for select
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "quotes_insert_admin"
  on public.quotes for insert
  with check (public.is_admin());

create policy "quotes_update_admin"
  on public.quotes for update
  using (public.is_admin());

create policy "quotes_update_client_status"
  on public.quotes for update
  using (
    recipient_email = (auth.jwt() ->> 'email')
    or client_id in (select id from public.clients where user_id = auth.uid())
  )
  with check (status in ('accepted', 'rejected'));

create policy "quotes_delete_admin"
  on public.quotes for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- content_packs
-- -----------------------------------------------------------------------------
alter table public.content_packs enable row level security;

create policy "content_packs_select_admin"
  on public.content_packs for select
  using (public.is_admin());

create policy "content_packs_select_client"
  on public.content_packs for select
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "content_packs_insert_admin"
  on public.content_packs for insert
  with check (public.is_admin());

create policy "content_packs_update_admin"
  on public.content_packs for update
  using (public.is_admin());

create policy "content_packs_delete_admin"
  on public.content_packs for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- content_files
-- -----------------------------------------------------------------------------
alter table public.content_files enable row level security;

create policy "content_files_select_admin"
  on public.content_files for select
  using (public.is_admin());

create policy "content_files_select_client"
  on public.content_files for select
  using (
    pack_id in (
      select cp.id
      from public.content_packs cp
      join public.clients c on c.id = cp.client_id
      where c.user_id = auth.uid()
    )
  );

create policy "content_files_insert_admin"
  on public.content_files for insert
  with check (public.is_admin());

create policy "content_files_update_admin"
  on public.content_files for update
  using (public.is_admin());

create policy "content_files_delete_admin"
  on public.content_files for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- client_uploads
-- -----------------------------------------------------------------------------
alter table public.client_uploads enable row level security;

create policy "client_uploads_select_admin"
  on public.client_uploads for select
  using (public.is_admin());

create policy "client_uploads_select_own"
  on public.client_uploads for select
  using (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "client_uploads_insert_client"
  on public.client_uploads for insert
  with check (
    client_id in (
      select id from public.clients where user_id = auth.uid()
    )
  );

create policy "client_uploads_delete_admin"
  on public.client_uploads for delete
  using (public.is_admin());

create policy "client_uploads_delete_own"
  on public.client_uploads for delete
  using (uploaded_by = auth.uid());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (public.is_admin());
