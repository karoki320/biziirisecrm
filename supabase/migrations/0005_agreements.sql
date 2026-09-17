-- ============================================================
-- Biziirise · 0005 · Agreements
--
-- A ticked box is only worth something if you can say, later and with
-- confidence, WHO ticked it, WHEN, and WHICH WORDS they were shown. That is
-- what this table stores. The PDF is a copy for the human; this row is the
-- record.
-- ============================================================

create table agreements (
  id            uuid primary key default gen_random_uuid(),

  -- Either may be null: a lead can sign before they are a client, and a client
  -- may have signed before we ever created a lead for them.
  client_id     uuid references clients (id) on delete set null,
  lead_id       uuid references leads (id) on delete set null,

  -- Who accepted, as they typed it. Kept verbatim even if the client record is
  -- later renamed — the agreement is a snapshot, not a live view.
  full_name     text not null,
  business      text not null,
  email         text not null,
  phone         text,

  -- What they accepted.
  service       text,
  package       text,
  terms_version text not null,

  -- Proof of acceptance.
  accepted_at   timestamptz not null default now(),
  ip            text,
  user_agent    text,

  -- The generated copy.
  storage_path  text unique,
  document_id   uuid references documents (id) on delete set null,

  created_at    timestamptz not null default now()
);

create index agreements_client_idx on agreements (client_id, accepted_at desc);
create index agreements_email_idx  on agreements (lower(email));

alter table agreements enable row level security;

-- A client sees their own agreements. Admin sees everything. Nobody inserts
-- from the browser — the server action writes with the service-role key,
-- because the person signing has no account yet.
create policy agreements_own_read on agreements
  for select using (client_id = current_client_id() or is_admin());
create policy agreements_admin_all on agreements
  for all using (is_admin()) with check (is_admin());
