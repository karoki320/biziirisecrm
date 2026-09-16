-- ============================================================
-- Biziirise · 0001 · core schema
-- leads → clients → projects → documents → invoices → payments
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type user_role      as enum ('admin', 'staff', 'client');
create type lead_status    as enum ('new', 'contacted', 'proposal', 'won', 'lost');
create type project_status as enum ('requested', 'in_progress', 'review', 'delivered');
create type invoice_status as enum ('draft', 'sent', 'partly_paid', 'paid', 'void');
create type payment_status as enum ('pending', 'success', 'failed', 'cancelled');

-- ---------- shared updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- clients ----------
-- A client is a business we work for. It exists before any login does.
create table clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  company         text,
  email           text,
  phone           text,
  whatsapp_phone  text,                       -- E.164 no '+', e.g. 254712345678
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index clients_email_idx on clients (lower(email));
create trigger clients_updated_at before update on clients
  for each row execute function set_updated_at();

-- ---------- profiles ----------
-- One row per auth user. `role` decides admin panel vs portal.
-- `client_id` is what every portal RLS policy pivots on.
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text,
  phone       text,
  client_id   uuid references clients (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_client_id_idx on profiles (client_id);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile on signup so no user is ever profile-less.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- leads ----------
-- Everything that lands before it becomes a client. Sources are free text
-- because 'WhatsApp CTA', 'referral', 'TikTok' will keep changing.
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text,
  phone               text,
  whatsapp_phone      text,
  source              text not null default 'whatsapp',
  page_context        text,                   -- which CTA produced it
  status              lead_status not null default 'new',
  message             text,
  notes               text,
  converted_client_id uuid references clients (id) on delete set null,
  last_contacted_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index leads_status_idx on leads (status, created_at desc);
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

-- ---------- projects ----------
create table projects (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients (id) on delete cascade,
  name          text not null,
  summary       text,
  status        project_status not null default 'requested',
  price_kes     numeric(12,2),
  started_at    date,
  delivered_at  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index projects_client_id_idx on projects (client_id, status);
create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- ---------- documents ----------
-- Files live in the `client-documents` storage bucket under
-- <client_id>/<project_id>/<filename>; this table is the index over them.
create table documents (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  project_id   uuid references projects (id) on delete set null,
  storage_path text not null unique,
  file_name    text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index documents_client_id_idx on documents (client_id, created_at desc);

-- ---------- invoices ----------
create table invoices (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id) on delete cascade,
  project_id   uuid references projects (id) on delete set null,
  number       text not null unique,
  amount_kes   numeric(12,2) not null check (amount_kes >= 0),
  paid_kes     numeric(12,2) not null default 0 check (paid_kes >= 0),
  status       invoice_status not null default 'draft',
  description  text,
  due_date     date,
  issued_at    timestamptz,
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index invoices_client_id_idx on invoices (client_id, status);
create trigger invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- ---------- payments ----------
-- One row per STK push attempt. Daraja callbacks update it in place.
create table payments (
  id                   uuid primary key default gen_random_uuid(),
  invoice_id           uuid not null references invoices (id) on delete cascade,
  provider             text not null default 'mpesa',
  amount_kes           numeric(12,2) not null check (amount_kes > 0),
  phone                text,
  status               payment_status not null default 'pending',
  checkout_request_id  text unique,
  merchant_request_id  text,
  mpesa_receipt        text unique,
  failure_reason       text,
  raw_callback         jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index payments_invoice_id_idx on payments (invoice_id, status);
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();

-- ---------- case studies ----------
-- Nothing reaches /work without client_signoff_at set. Enforced, not remembered.
create table case_studies (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references clients (id) on delete set null,
  slug              text not null unique,
  title             text not null,
  client_display    text not null,            -- name as the client agreed to show it
  scope             text,
  outcome           text,
  body              text,
  cover_image_url   text,
  sort_order        int not null default 0,
  client_signoff_at timestamptz,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint published_requires_signoff
    check (published = false or client_signoff_at is not null)
);
create trigger case_studies_updated_at before update on case_studies
  for each row execute function set_updated_at();

-- ---------- activity log ----------
create table activity_log (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients (id) on delete cascade,
  lead_id     uuid references leads (id) on delete cascade,
  actor_id    uuid references auth.users (id) on delete set null,
  type        text not null,                  -- 'document.uploaded', 'status.changed', ...
  description text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index activity_log_client_idx on activity_log (client_id, created_at desc);
create index activity_log_lead_idx on activity_log (lead_id, created_at desc);
