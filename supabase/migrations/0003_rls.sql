-- ============================================================
-- Biziirise · 0003 · Row Level Security
--
-- Rule of the house: a client sees their own rows and nothing else.
-- Admin sees everything. Anonymous sees published case studies only.
-- The service-role key bypasses all of this — it is server-only and is
-- the ONLY thing the automation runner uses.
-- ============================================================

-- ---------- helpers ----------
-- security definer so a client can be checked against profiles without
-- being able to read the profiles table generally.
create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin','staff'), false);
$$;

create or replace function current_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from profiles where id = auth.uid();
$$;

-- ---------- enable everywhere ----------
alter table profiles             enable row level security;
alter table clients              enable row level security;
alter table leads                enable row level security;
alter table projects             enable row level security;
alter table documents            enable row level security;
alter table invoices             enable row level security;
alter table payments             enable row level security;
alter table case_studies         enable row level security;
alter table activity_log         enable row level security;
alter table sequences            enable row level security;
alter table sequence_steps       enable row level security;
alter table sequence_enrollments enable row level security;
alter table message_log          enable row level security;

-- ---------- profiles ----------
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = auth_role());
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------- clients ----------
create policy clients_own_read on clients
  for select using (id = current_client_id() or is_admin());
create policy clients_admin_write on clients
  for all using (is_admin()) with check (is_admin());

-- ---------- leads (CRM only — never client-visible) ----------
create policy leads_admin_all on leads
  for all using (is_admin()) with check (is_admin());

-- ---------- projects ----------
create policy projects_own_read on projects
  for select using (client_id = current_client_id() or is_admin());
create policy projects_admin_write on projects
  for all using (is_admin()) with check (is_admin());

-- ---------- documents ----------
create policy documents_own_read on documents
  for select using (client_id = current_client_id() or is_admin());
-- Clients may upload into their own folder, and only their own.
create policy documents_own_insert on documents
  for insert with check (client_id = current_client_id() or is_admin());
create policy documents_admin_write on documents
  for all using (is_admin()) with check (is_admin());

-- ---------- invoices ----------
create policy invoices_own_read on invoices
  for select using (client_id = current_client_id() or is_admin());
create policy invoices_admin_write on invoices
  for all using (is_admin()) with check (is_admin());

-- ---------- payments ----------
create policy payments_own_read on payments
  for select using (
    is_admin() or exists (
      select 1 from invoices i
      where i.id = payments.invoice_id and i.client_id = current_client_id()
    )
  );
create policy payments_admin_write on payments
  for all using (is_admin()) with check (is_admin());

-- ---------- case studies (public surface) ----------
create policy case_studies_public_read on case_studies
  for select using (published = true and client_signoff_at is not null);
create policy case_studies_admin_all on case_studies
  for all using (is_admin()) with check (is_admin());

-- ---------- activity log ----------
create policy activity_own_read on activity_log
  for select using (client_id = current_client_id() or is_admin());
create policy activity_admin_all on activity_log
  for all using (is_admin()) with check (is_admin());

-- ---------- automation tables (admin only) ----------
create policy sequences_admin_all on sequences
  for all using (is_admin()) with check (is_admin());
create policy sequence_steps_admin_all on sequence_steps
  for all using (is_admin()) with check (is_admin());
create policy enrollments_admin_all on sequence_enrollments
  for all using (is_admin()) with check (is_admin());
create policy message_log_admin_all on message_log
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- Storage: client-documents bucket
-- Path convention: <client_id>/<project_id | 'general'>/<filename>
-- The first path segment is the client id, so the policy is a
-- string comparison against the caller's own client_id.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

create policy "client documents: read own"
  on storage.objects for select
  using (
    bucket_id = 'client-documents'
    and (is_admin() or (storage.foldername(name))[1] = current_client_id()::text)
  );

create policy "client documents: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'client-documents'
    and (is_admin() or (storage.foldername(name))[1] = current_client_id()::text)
  );

create policy "client documents: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'client-documents'
    and (is_admin() or (storage.foldername(name))[1] = current_client_id()::text)
  );
