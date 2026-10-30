-- ============================================================
-- Biziirise · 0009 · Custom agreements per project
--
-- A signing request is either the STANDARD agreement (our terms in
-- lib/terms.ts) or a CUSTOM one: the PDF drawn up for that specific
-- project, uploaded by us. The client reads it and signs; the signature is
-- stamped onto their copy of that same PDF.
-- ============================================================

alter table signature_requests
  add column if not exists kind text not null default 'standard'
    check (kind in ('standard', 'custom')),
  add column if not exists title text,
  add column if not exists custom_path text,
  add column if not exists custom_sha256 text,
  add column if not exists project_id uuid references projects (id) on delete set null;

alter table signature_requests
  drop constraint if exists signature_requests_custom_has_file;
alter table signature_requests
  add constraint signature_requests_custom_has_file
    check (kind = 'standard' or custom_path is not null);
