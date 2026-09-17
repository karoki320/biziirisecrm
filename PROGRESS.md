# Where we are

**Read this file first.** `docs/SETUP.md` is the reference manual — go there only
when this file sends you. Last updated 17 Sep 2026.

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

- Admin panel can add clients, edit them, invite them to the portal, revoke access.
  No more SQL in Supabase for any of that.
- WhatsApp inbound webhook built: a first message becomes a lead with the page
  that produced it attached.
- Resend account created, `biziirise.com` verified via Auto configure.
- Your account promoted to `admin`.
- Supabase URL Configuration fixed (Site URL + redirect allow-list). The magic
  link was silently falling back to the homepage before this.
- Admins now land on `/admin` instead of an empty `/portal`. Commit `2b19d47`.

---

## Open — in order

1. **`git push`** — commit `2b19d47` is local only.
2. **Vercel env vars** — `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, all three
   environments, then redeploy. *(Confirm whether this is done.)*
3. **Supabase email templates** — Magic Link and Invite user must use
   `{{ .TokenHash }}`, not `{{ .ConfirmationURL }}`. Without this, invite links
   break.
4. **Supabase SMTP** — host `smtp.resend.com`, port 465, username `resend`,
   password = Resend API key, sender `hello@biziirise.com`.
5. **Turn OFF "Enable sign ups"** — Authentication → Sign In / Providers.
   Clients never register themselves; you invite them.
6. **Test** — invite your own personal address from `/admin/clients`, confirm it
   arrives from biziirise.com and the link signs you in.
7. **Add your first real client** in `/admin/clients`.

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
