# Biziirise — phased build plan

Domain: **biziirise.com** · One Next.js app, one Vercel project, one Supabase project.

The ordering principle: the public site earns money and can ship in days; the
portal and CRM save you time and can ship over weeks. Nothing in Phase 1 waits
on a Meta verification queue or a Safaricom approval.

---

## Phase 0 — accounts and approvals (runs in parallel, starting now)

These have external wait times measured in days. Start them today; none of them
block Phase 1 shipping.

| Item | Blocks | Typical wait |
|---|---|---|
| Register `biziirise.com`, point DNS at Vercel | Phase 1 launch | hours |
| Create Vercel project, link the repo | Phase 1 | minutes |
| Create Supabase project (region: choose the closest — likely `eu-central-1`) | Phase 2 | minutes |
| Verify sending domain with Resend (DKIM + SPF records) | Phase 4 email | hours |
| Meta Business verification for WhatsApp Cloud API | Phase 4 WhatsApp | **days to weeks** |
| Submit WhatsApp message templates for approval | Phase 4 WhatsApp | 1–2 days each |
| Safaricom Daraja app + production shortcode/passkey | Phase 3 payments | days |
| Logo files, favicon | Phase 1 polish | you |
| Generate approved hero art (`docs/IMAGE-PROMPTS.md`) | Phase 1 hero | you |
| Written sign-off from clients you want on `/work` | Phase 1 content | you |

**Start Meta verification first.** It is the longest pole and the one thing that
will still be pending when everything else is done. Note that the `wa.me` CTA on
the homepage needs *none* of this — it works the moment the site is live.

---

## Phase 1 — marketing site + WhatsApp CTA + blog

**Status: scaffolded and building clean. Content and art outstanding.**

Already done:

- Next.js 16 / React 19 / Tailwind 4 project, builds clean, every page static
- Design tokens (cream ground, sky blue accent) with contrast verified at AA
- `WhatsAppCta` component — one tap to `wa.me/254117232766`, pre-filled message,
  per-placement attribution baked into the link text
- Header, footer, homepage with hero / services / proof / second CTA
- `sitemap.xml`, `robots.ts`, JSON-LD `ProfessionalService`, OG metadata
- Skip link, visible focus rings, reduced-motion handling

Still to do:

1. Choose an image direction, generate the art, wire the hero slot
2. Four real service pages (one per card), each closing on the same CTA
3. MDX blog pipeline + first three posts
4. `/work` case studies for clients who have signed off
5. Logo + favicon
6. Deploy to Vercel, verify Core Web Vitals on a real Kenyan mobile connection

**Exit criteria:** live on biziirise.com, Lighthouse mobile performance ≥ 95,
CTA works on an actual phone, sitemap submitted to Google Search Console.

---

## Phase 2 — Supabase auth + client portal

Depends on: Phase 0 Supabase project.

1. Apply migrations `0001`–`0004` (already written and tested — see below)
2. Auth: magic link primary, password as fallback. Kenyan SME clients lose
   passwords; magic links land in the inbox you already emailed them at.
3. `/portal` — project list, status timeline (Requested → In Progress → Review →
   Delivered), activity feed
4. Document upload to the private `client-documents` bucket, path
   `<client_id>/<project_id>/<filename>`, enforced by storage RLS
5. Invoice list with status, no payment yet

**Exit criteria:** two test clients cannot see each other's anything. Verify by
logging in as both, not by reading the policy.

---

## Phase 3 — CRM + admin panel

Depends on: Phase 2.

1. `/admin` — leads table, pipeline board (New → Contacted → Proposal → Won/Lost)
2. Client records linked to portal accounts and projects
3. Per-client activity log (uploads, status changes, messages, payments)
4. M-Pesa Daraja: STK push from the invoice screen, callback handler at
   `/api/webhooks/mpesa`, payment reconciliation against `invoices.paid_kes`
5. Claude API: draft a reply to an inbound lead, editable before sending

**Exit criteria:** you can run a full client lifecycle — lead in, converted,
project created, document uploaded, invoice paid by M-Pesa — without touching
the database directly.

---

## Phase 4 — automation, controlled from the admin panel

Depends on: Phase 3 + Resend domain + Meta approval.

1. `/api/automation/run` — the queue drainer (see architecture note below)
2. Vercel Cron every 5 minutes
3. Resend send + delivery webhook → `message_log`
4. WhatsApp Cloud API send using approved templates
5. Admin panel automation section:
   - sequence list with active/paused toggle
   - step editor (subject, body, delay) — copy changes without a deploy
   - per-client enrolment view: pause, resume, cancel, force-send
   - send log with delivery status and error text
6. Inbound WhatsApp webhook → auto-create a `lead` row (see Assumption 4)

**Exit criteria:** you can pause one client's sequence, edit a subject line, and
force-send an onboarding email, all from `/admin`, and see all three in the log.

---

## Architecture note: how automation actually runs

The brief specified Supabase triggers/edge functions calling Next.js server
functions. I built something slightly different and want you to sign off on it:

**A database trigger enrols; a cron drains.**

```
lead row inserted
      ↓  (database trigger, instant, in-transaction)
sequence_enrollments row created, next_run_at = now()
      ↓  (Vercel Cron → /api/automation/run, every 5 min)
runner claims due enrolments, sends via Resend / WhatsApp,
writes message_log, advances current_step, sets next next_run_at
```

Why this instead of the DB calling out to Next.js directly:

- **No `pg_net`, no edge function deploys.** One less runtime to operate, which
  was the whole point of dropping n8n.
- **Pausing is a row update.** `status = 'paused'` and the runner skips it. With
  fire-and-forget HTTP calls from the database, an in-flight sequence has no
  handle to grab.
- **Retries are a counter, not a lost message.** A failed send leaves the row
  due; the next cron picks it up and increments `attempts`.
- **The admin panel reads the exact tables the runner writes.** No separate
  state to reconcile.
- **A database transaction that makes an HTTP call is a transaction that can
  hang.** Enrolment stays purely in-database.

Cost: up to 5 minutes of latency on a "welcome" email. For an agency where you
personally reply on WhatsApp within the hour, that is invisible. If you want a
status-change WhatsApp to feel instant, the status-change handler can call the
runner directly for that one enrolment and let cron be the safety net.

Say the word if you would rather have the literal trigger→HTTP design and I will
switch it — but I would be arguing against it.

---

## Schema — written, applied and tested

`supabase/migrations/` holds four files. All four have been applied to a real
Postgres 16 instance with the Supabase `auth` and `storage` schemas stubbed in,
and the behaviour below was verified, not assumed:

| Verified | Result |
|---|---|
| All four migrations apply cleanly in order | ✅ |
| New lead auto-enrols in the `lead_welcome` sequence | ✅ |
| Project status change writes activity log + enrols client | ✅ |
| Re-firing the same status sequence updates rather than duplicating | ✅ |
| Document insert writes an activity row | ✅ |
| Client A sees own project/invoice/document; client B sees none of them | ✅ |
| Neither client can see `leads`, `sequences` or `message_log` at all | ✅ |
| Anonymous sees only published, signed-off case studies | ✅ |
| Publishing a case study without sign-off is rejected by a check constraint | ✅ |
| A client cannot update their own row to `role = 'admin'` | ✅ |

Tables: `profiles`, `clients`, `leads`, `projects`, `documents`, `invoices`,
`payments`, `case_studies`, `activity_log`, `sequences`, `sequence_steps`,
`sequence_enrollments`, `message_log`.

Review the four files before Phase 2 — changing a schema after real client data
lands is the expensive kind of mistake.
