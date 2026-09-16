# Biziirise

Marketing site, client portal, CRM and automation for Biziirise Digital Agency.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres, Auth, Storage) ·
Resend · WhatsApp Cloud API · M-Pesa Daraja · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in as you complete Phase 0
npm run dev
```

The marketing site runs without any environment variables except
`NEXT_PUBLIC_SITE_URL`. Supabase keys are only needed from Phase 2.

## Layout

```
app/
  (marketing)/    public site — home, services, work, blog
  (auth)/         login
  (portal)/       client portal            [Phase 2]
  (admin)/        CRM + automation control [Phase 3-4]
  api/            webhooks, automation runner
components/       shared UI
lib/
  site.ts         single source of truth for phone, WhatsApp link, socials
  supabase/       browser / server / service-role clients
  whatsapp.ts     Cloud API sends + Kenyan number normalisation
  email.ts        Resend
  mpesa.ts        Daraja STK push
supabase/
  migrations/     0001 core · 0002 automation · 0003 RLS · 0004 seed
docs/
  BUILD-PLAN.md   phases, exit criteria, architecture rationale
  ASSUMPTIONS.md  every decision made on your behalf — read this one
  IMAGE-PROMPTS.md four hero art directions, pick one
proxy.ts          session refresh + route gating (Next 16 middleware)
```

## Applying the schema

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Or paste each file in `supabase/migrations/` into the Supabase SQL editor in
numeric order.

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is used only by
  `lib/supabase/admin.ts`, which is `server-only`. Never prefix it `NEXT_PUBLIC_`.
- Every client-facing table has RLS on. `proxy.ts` gates page shells; RLS is what
  actually protects data.
- The `client-documents` bucket is private. Path is `<client_id>/<...>` and the
  storage policy compares that first segment to the caller's own `client_id`.

## Scripts

| | |
|---|---|
| `npm run dev` | local dev server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
"# biziirisecrm" 
