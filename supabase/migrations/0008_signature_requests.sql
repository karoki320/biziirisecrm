-- ============================================================
-- Biziirise · 0008 · Drawn signatures in the portal
--
-- When a client is invited to the portal we can ask them to sign the
-- service agreement there. They already have it on paper, so the portal
-- shows the same agreement with a box to sign in with a finger or mouse.
-- The drawn signature is stamped into the PDF and filed in their documents.
--
-- signature_requests is the "please sign this" note. The signed result is
-- still an ordinary row in `agreements`, so every agreement — ticked or
-- drawn — lives in one table.
-- ============================================================

create table if not exists signature_requests (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients (id) on delete cascade,

  -- Who we expect to sign, prefilled from the invite. They can correct it.
  full_name     text,
  email         text,

  -- What the agreement is for.
  service       text,
  package       text,

  status        text not null default 'pending'
                check (status in ('pending', 'signed', 'cancelled')),
  requested_by  uuid references auth.users (id) on delete set null,
  requested_at  timestamptz not null default now(),
  signed_at     timestamptz,
  agreement_id  uuid references agreements (id) on delete set null
);

create index if not exists signature_requests_client_idx
  on signature_requests (client_id, requested_at desc);

alter table signature_requests enable row level security;

-- A client can see their own requests; staff see and manage all.
-- Signing itself goes through a server action with the service-role key.
create policy signature_requests_own_read on signature_requests
  for select using (client_id = current_client_id() or is_staff());
create policy signature_requests_staff_all on signature_requests
  for all using (is_admin()) with check (is_admin());

-- How an agreement was signed, and where the drawn signature image is kept.
alter table agreements
  add column if not exists signed_via text not null default 'tickbox'
    check (signed_via in ('tickbox', 'drawn')),
  add column if not exists signature_path text,
  add column if not exists signature_request_id uuid
    references signature_requests (id) on delete set null;
