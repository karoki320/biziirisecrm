-- ============================================================
-- Biziirise · 0002 · automation
--
-- Design note: there is no n8n and no pg_net here. A database trigger
-- enrols a lead/client into a sequence the instant the row lands, then a
-- Vercel Cron (every 5 min) calls /api/automation/run, which drains
-- everything whose next_run_at has passed. Pausing a sequence for one
-- client is a row update, retries are a counter, and the admin panel
-- reads exactly the same tables the runner writes.
-- ============================================================

create type sequence_channel   as enum ('email', 'whatsapp');
create type enrollment_status  as enum ('active', 'paused', 'completed', 'cancelled');
create type message_status     as enum ('queued', 'sent', 'delivered', 'failed', 'skipped');

-- ---------- sequences ----------
create table sequences (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,   -- 'lead_welcome', 'proposal_followup', ...
  name          text not null,
  description   text,
  trigger_event text not null,          -- 'lead.created', 'client.onboarded', ...
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger sequences_updated_at before update on sequences
  for each row execute function set_updated_at();

-- ---------- sequence steps ----------
-- Copy is edited here, from the admin panel. Never in a code deploy.
-- {{first_name}}, {{project_name}}, {{status}} are substituted at send time.
create table sequence_steps (
  id                     uuid primary key default gen_random_uuid(),
  sequence_id            uuid not null references sequences (id) on delete cascade,
  step_order             int not null,
  delay_minutes          int not null default 0 check (delay_minutes >= 0),
  channel                sequence_channel not null,
  subject                text,                 -- email only
  body_template          text not null,
  whatsapp_template_name text,                 -- required for out-of-window WhatsApp
  active                 boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (sequence_id, step_order),
  constraint email_needs_subject
    check (channel <> 'email' or subject is not null),
  constraint whatsapp_needs_template
    check (channel <> 'whatsapp' or whatsapp_template_name is not null)
);
create trigger sequence_steps_updated_at before update on sequence_steps
  for each row execute function set_updated_at();

-- ---------- enrolments ----------
-- One row = one recipient moving through one sequence. This row IS the
-- pause switch the admin panel flips.
create table sequence_enrollments (
  id            uuid primary key default gen_random_uuid(),
  sequence_id   uuid not null references sequences (id) on delete cascade,
  lead_id       uuid references leads (id) on delete cascade,
  client_id     uuid references clients (id) on delete cascade,
  status        enrollment_status not null default 'active',
  current_step  int not null default 0,
  next_run_at   timestamptz not null default now(),
  attempts      int not null default 0,
  last_error    text,
  context       jsonb not null default '{}'::jsonb,  -- template variables
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  constraint enrollment_has_a_subject
    check (lead_id is not null or client_id is not null)
);
-- The runner's only query: due, active work.
create index enrollments_due_idx
  on sequence_enrollments (next_run_at)
  where status = 'active';
-- Never enrol the same lead in the same sequence twice.
create unique index enrollments_lead_unique
  on sequence_enrollments (sequence_id, lead_id) where lead_id is not null;
create unique index enrollments_client_unique
  on sequence_enrollments (sequence_id, client_id) where client_id is not null;
create trigger enrollments_updated_at before update on sequence_enrollments
  for each row execute function set_updated_at();

-- ---------- send log ----------
-- What went out, when, to whom, and what the provider said back.
create table message_log (
  id                  uuid primary key default gen_random_uuid(),
  enrollment_id       uuid references sequence_enrollments (id) on delete set null,
  sequence_step_id    uuid references sequence_steps (id) on delete set null,
  lead_id             uuid references leads (id) on delete set null,
  client_id           uuid references clients (id) on delete set null,
  channel             sequence_channel not null,
  recipient           text not null,
  subject             text,
  body                text,
  status              message_status not null default 'queued',
  provider            text,                  -- 'resend' | 'whatsapp_cloud'
  provider_message_id text,
  error               text,
  triggered_manually  boolean not null default false,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now()
);
create index message_log_created_idx on message_log (created_at desc);
create index message_log_client_idx  on message_log (client_id, created_at desc);
create index message_log_status_idx  on message_log (status, created_at desc);

-- ---------- enrolment triggers ----------
-- A new lead enters every active sequence listening for 'lead.created'.
create or replace function enroll_on_lead_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into sequence_enrollments (sequence_id, lead_id, next_run_at, context)
  select s.id, new.id, now(),
         jsonb_build_object('first_name', split_part(coalesce(new.name, ''), ' ', 1))
  from sequences s
  where s.active and s.trigger_event = 'lead.created'
  on conflict do nothing;
  return new;
end;
$$;
create trigger leads_enroll_after_insert
  after insert on leads
  for each row execute function enroll_on_lead_created();

-- A project status change enrols the client in the status-update sequence.
create or replace function enroll_on_project_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into activity_log (client_id, type, description, metadata)
    values (new.client_id, 'project.status_changed',
            format('Project "%s" moved to %s', new.name, new.status),
            jsonb_build_object('project_id', new.id, 'from', old.status, 'to', new.status));

    insert into sequence_enrollments (sequence_id, client_id, next_run_at, context)
    select s.id, new.client_id, now(),
           jsonb_build_object('project_name', new.name, 'status', new.status::text)
    from sequences s
    where s.active and s.trigger_event = 'project.status_changed'
    on conflict (sequence_id, client_id) where client_id is not null
    do update set status = 'active', current_step = 0, next_run_at = now(),
                  attempts = 0, last_error = null,
                  context = excluded.context;
  end if;
  return new;
end;
$$;
create trigger projects_status_change
  after update on projects
  for each row execute function enroll_on_project_status_change();

-- Document uploads are logged for the client activity feed.
create or replace function log_document_upload()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activity_log (client_id, actor_id, type, description, metadata)
  values (new.client_id, new.uploaded_by, 'document.uploaded',
          format('Uploaded %s', new.file_name),
          jsonb_build_object('document_id', new.id, 'project_id', new.project_id));
  return new;
end;
$$;
create trigger documents_log_upload
  after insert on documents
  for each row execute function log_document_upload();
