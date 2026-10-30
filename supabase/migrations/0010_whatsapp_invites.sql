-- ============================================================
-- Biziirise · 0010 · Portal invites over WhatsApp
--
-- Email is a headache for most clients. Instead we send a link on
-- WhatsApp; they open it, choose a password, and they are in. From then
-- on they sign in with their phone number and that password.
--
-- Only a SHA-256 of the token is stored, so a leaked table cannot be used
-- to open anyone's invite.
-- ============================================================

create table if not exists client_invites (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  phone        text not null,                 -- E.164 without '+', e.g. 254712345678
  full_name    text,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  cancelled_at timestamptz,
  user_id      uuid references auth.users (id) on delete set null,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists client_invites_client_idx on client_invites (client_id, created_at desc);

alter table client_invites enable row level security;

-- Staff manage invites from the CRM. The client side never reads this table
-- directly — the join page checks tokens with the service-role key.
create policy client_invites_admin_all on client_invites
  for all using (is_admin()) with check (is_admin());
