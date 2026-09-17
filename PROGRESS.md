# Where we are

**Read this file first.** `docs/SETUP.md` is the reference manual — go there only
when this file sends you. Last updated 17 Sep 2026, afternoon.

---

## Live right now

| Thing | State |
|---|---|
| www.biziirise.com | live, HTTPS, canonicals correct |
| Marketing site, services, work, blog | live |
| Admin CRM (`/admin`) | live, you can sign in |
| Client portal (`/portal`) | live, nobody invited yet |
| Supabase | connected, 13 tables, RLS on |
| Resend domain `biziirise.com` | **verified** (DKIM + SPF + MX all resolving) |
| WhatsApp inbound webhook | deployed, inert until Meta approves |
| M-Pesa | built, **paused** at your request |

Your account: `biziirise@gmail.com` — role `admin`.

---

## Done today (17 Sep)

**Morning — the CRM**
- Admin panel can add clients, edit them, invite them to the portal, revoke access.
  No more SQL in Supabase for any of that.
- WhatsApp inbound webhook: a first message becomes a lead with the page that
  produced it attached.
- Resend verified, SMTP wired, email arriving from biziirise.com.
- Your account promoted to `admin`; Supabase URL config fixed.
- Admins land on `/admin`, not an empty `/portal`.

**Afternoon — the front of the site**
- Headline is now *Software that runs your business with you.*
- Contact details: **+254 141 025 616** everywhere, `hello@biziirise.com` shown
  publicly, `biziirise@gmail.com` kept as the inbox we actually send copies to.
- **Mobile nav** — a real menu with Services, Work, Blog, **Client login** and
  WhatsApp. Client login used to disappear on phones entirely.
- **Service finder** — "What are you looking for?" on the homepage. Search in
  plain words ("online shop", "posters", "mpesa"), pick a service, read the
  packages, pick one, then four fields and WhatsApp opens introduced. The lead
  is written to the CRM *before* the handoff, so someone who fills the form and
  wanders off is still yours.
- **Terms + agreement** — `/terms` is the plain-language version, `/agreement`
  is the tick-box. Ticking generates a dated PDF with their details and the full
  terms, emails it to them and to you, files it in their portal if they are
  already a client, and records who/when/from where in a new `agreements` table.

## Open — in order

1. **`git push`** — several commits are local only. Nothing today is live until
   you push.
2. **Run migration `0005_agreements.sql`** in Supabase → SQL Editor. The
   agreement flow needs that table. Everything else works without it.
3. **Vercel env vars** — `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, all three
   environments, then redeploy. *(Confirm whether this is done.)*
4. **Turn OFF "Enable sign ups"** — Authentication → Sign In / Providers.
   Clients never register themselves; you invite them.
5. **Have an advocate read `lib/terms.ts`.** It is written to match how you
   actually work, but it is not legal advice and I am not a lawyer. Bump
   `TERMS_VERSION` if anything changes — old agreements keep saying which
   wording they were signed against.
6. **Add your first real client** in `/admin/clients`.

## Later, not blocking

- **Meta Business verification** — the long queue, days to weeks. Everything
  WhatsApp waits behind it. Costs nothing to start.
- **DMARC record** — TXT at `_dmarc`, value `v=DMARC1; p=none; rua=mailto:hello@biziirise.com`.
- **M-Pesa** — resume when your Safaricom docs are ready.
- Homepage headline still says "software", which predates the marketing service.
- 7 of 8 interior header images not generated.

---

## Things that will bite you

- **WhatsApp access token from Meta's API Setup page expires in 24 hours.**
  Production needs a System User token with expiry set to Never.
- **Supabase redirect URLs need the `/**` wildcard.** Without it, redirects fail
  silently and land on the homepage instead of erroring.
- **Run git from Windows.** The Claude session bridge has no GitHub credentials.
- **Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.** It bypasses
  every security policy in the database.
- **`hello@biziirise.com` is a sending identity, not a mailbox.** Mail we send
  ourselves goes to `biziirise@gmail.com` (`site.inbox`), or it lands nowhere.
- **The terms live in one file.** `lib/terms.ts` feeds both the web page and the
  PDF, so a client can never tick one version and receive another.
