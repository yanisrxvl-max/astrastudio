-- Astra Studio – Storage Buckets & Policies
-- Run AFTER migration.sql and rls_policies.sql

-- ============================================================
-- CREATE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('content-delivery', 'content-delivery', false, 5368709120),   -- 5 GB
  ('client-uploads',   'client-uploads',   false, 524288000),    -- 500 MB
  ('quotes-pdf',       'quotes-pdf',       false, null),
  ('avatars',          'avatars',          false, null);

-- ============================================================
-- CONTENT-DELIVERY
-- Admin can upload/manage. Client can download files in their path.
-- ============================================================

create policy "content_delivery_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'content-delivery'
    and is_admin()
  );

create policy "content_delivery_admin_select"
  on storage.objects for select
  using (
    bucket_id = 'content-delivery'
    and is_admin()
  );

create policy "content_delivery_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'content-delivery'
    and is_admin()
  );

create policy "content_delivery_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'content-delivery'
    and is_admin()
  );

create policy "content_delivery_client_select"
  on storage.objects for select
  using (
    bucket_id = 'content-delivery'
    and (storage.foldername(name))[1] in (
      select id::text from clients where user_id = auth.uid()
    )
  );

-- ============================================================
-- CLIENT-UPLOADS
-- Client can upload to their path. Admin can read all.
-- ============================================================

create policy "client_uploads_client_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] in (
      select id::text from clients where user_id = auth.uid()
    )
  );

create policy "client_uploads_client_select"
  on storage.objects for select
  using (
    bucket_id = 'client-uploads'
    and (storage.foldername(name))[1] in (
      select id::text from clients where user_id = auth.uid()
    )
  );

create policy "client_uploads_admin_select"
  on storage.objects for select
  using (
    bucket_id = 'client-uploads'
    and is_admin()
  );

create policy "client_uploads_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'client-uploads'
    and is_admin()
  );

-- ============================================================
-- QUOTES-PDF
-- Admin can upload. Client can read their own quotes' PDFs.
-- ============================================================

create policy "quotes_pdf_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'quotes-pdf'
    and is_admin()
  );

create policy "quotes_pdf_admin_select"
  on storage.objects for select
  using (
    bucket_id = 'quotes-pdf'
    and is_admin()
  );

create policy "quotes_pdf_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'quotes-pdf'
    and is_admin()
  );

create policy "quotes_pdf_client_select"
  on storage.objects for select
  using (
    bucket_id = 'quotes-pdf'
    and (storage.foldername(name))[1] in (
      select id::text from quotes
      where recipient_email = auth.email()
         or client_id in (select id from clients where user_id = auth.uid())
    )
  );

-- ============================================================
-- AVATARS
-- Users can upload/read their own avatar (path starts with uid).
-- ============================================================

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_select_own"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
