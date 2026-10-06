-- ============================================================
-- Biziirise · 0007 · Real roles, and invitable team members
--
-- Until now `is_admin()` returned true for BOTH 'admin' and 'staff'.
-- That was fine while the only person with a login was the owner. The
-- moment a salesperson gets a login it is a hole: they would see every
-- invoice, every payment, every client's pricing and the whole revenue
-- picture of the business.
--
-- So the roles get split properly:
--
--   is_admin()  → 'admin' only. Money, automation, the team itself.
--   is_staff()  → 'admin' or 'staff'. The selling surface: leads,
--                 clients, projects, activity.
--
-- Everything already written in terms of is_admin() therefore TIGHTENS
-- automatically. The policies that should stay open to a salesperson are
-- the ones explicitly repointed at is_staff() below — nothing else.
--
-- The deliberate omissions, because each is a way to leak or escalate:
--   profiles  — staff cannot write profiles, or they would set their own
--               role to 'admin' in one request.
--   invoices,
--   payments  — the whole point of the split.
--   sequences,
--   message_log — automation can message every client; not a sales job.
-- ============================================================

-- ---------- helpers ----------
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) in ('admin','staff'), false);
$$;

-- Narrowed. Was ('admin','staff').
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false);
$$;

-- ---------- the selling surface opens to staff ----------
drop policy if exists leads_admin_all on leads;
create policy leads_staff_all on leads
  for all using (is_staff()) with check (is_staff());

drop policy if exists clients_own_read on clients;
create policy clients_own_read on clients
  for select using (id = current_client_id() or is_staff());
drop policy if exists clients_admin_write on clients;
create policy clients_staff_write on clients
  for all using (is_staff()) with check (is_staff());

drop policy if exists projects_own_read on projects;
create policy projects_own_read on projects
  for select using (client_id = current_client_id() or is_staff());
drop policy if exists projects_admin_write on projects;
create policy projects_staff_write on projects
  for all using (is_staff()) with check (is_staff());

drop policy if exists activity_own_read on activity_log;
create policy activity_own_read on activity_log
  for select using (client_id = current_client_id() or is_staff());
drop policy if exists activity_admin_all on activity_log;
create policy activity_staff_all on activity_log
  for all using (is_staff()) with check (is_staff());

-- Staff may READ a client's documents (an agreement, a brief) but not
-- write or delete them. Note the asymmetry — it is intentional.
drop policy if exists documents_own_read on documents;
create policy documents_own_read on documents
  for select using (client_id = current_client_id() or is_staff());

-- Storage mirrors it: staff can open a file, not replace or remove one.
drop policy if exists "client documents: read own" on storage.objects;
create policy "client documents: read own"
  on storage.objects for select
  using (
    bucket_id = 'client-documents'
    and (is_staff() or (storage.foldername(name))[1] = current_client_id()::text)
  );

-- Profiles: staff may read the team list so a lead can show an owner's
-- name. Writing stays admin-only — see the note at the top.
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_staff());

-- ---------- lead ownership ----------
-- Who on the team is working this lead. Null means unclaimed.
alter table leads
  add column if not exists owner_id uuid references profiles (id) on delete set null;
create index if not exists leads_owner_idx on leads (owner_id, created_at desc);

-- ---------- team invites ----------
-- An invite is a durable, revocable claim on a role. The token is the
-- whole credential, so it is single-use, expiring, and revocable —
-- Eugene sends these over WhatsApp, where a link lives in a chat forever.
create table if not exists team_invites (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  email       text not null,
  full_name   text,
  phone       text,
  role        user_role not null default 'staff',
  invited_by  uuid references profiles (id) on delete set null,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references profiles (id) on delete set null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint team_invites_role_check check (role in ('admin','staff'))
);
create index if not exists team_invites_email_idx on team_invites (lower(email));
create index if not exists team_invites_open_idx on team_invites (created_at desc)
  where accepted_at is null and revoked_at is null;

alter table team_invites enable row level security;

-- Admin only, and no anonymous read of any kind. Redeeming an invite
-- happens in a server action with the service-role key, which is the
-- only thing that ever matches a token — a token is never checked in
-- the browser, so it cannot be brute-forced through the API.
create policy team_invites_admin_all on team_invites
  for all using (is_admin()) with check (is_admin());
