# Your side of the parallel track

The portal is built. These are the things only you can do, because they need
your accounts and your identity. Do them in this order — each one unblocks the
next, and the first two get the site live.

---

## 1 · Push to GitHub  (10 minutes)

The repo is initialised with two commits. Run these **in Windows** — PowerShell
or Git Bash, in the project folder. Not through me: this session's bridge cannot
delete files cleanly, which jams git's lock files.

```
git remote add origin https://github.com/<you>/biziirise.git
git push -u origin main
```

Make the repo **private**. Nothing secret is committed — `.env*.local` is
ignored and I verified that — but there is no reason for it to be public.

## 2 · Vercel  (15 minutes, and the site is live)

1. vercel.com → **Add New → Project** → import the repo.
2. Framework preset: Next.js. Everything else: defaults.
3. Environment variables — add just this one for now:
   `NEXT_PUBLIC_SITE_URL` = `https://biziirise.com`
4. Deploy.

You will get a `*.vercel.app` URL. **The whole marketing site works at that URL
immediately** — services, pricing, work, blog, WhatsApp CTA. The portal shows
"not switched on yet", which is correct and deliberate.

## 3 · Point the domain  (Truehost — read this, it bit us)

**The domain is registered through Truehost, who resell NameSilo. It is
delegated to Truehost's nameservers — `ns1.cloudoon.com`, `ns2.cloudoon.net`,
`ns3.cloudoon.org` — and those nameservers currently REFUSE queries for
biziirise.com.**

That is a *lame delegation*: the .com registry says "ask Truehost about this
domain", and Truehost's servers answer "not mine". It means no DNS zone was ever
created for the domain on their side. Registering a domain and provisioning its
DNS zone are two different things at Truehost, and the second one did not happen.

**Consequence:** nothing you add in Vercel can work. Vercel verifies a domain by
querying its nameservers, and those nameservers will not answer. This is not a
Vercel problem and no amount of adding records there will fix it.

### The fix: move DNS to Vercel

In the **Truehost client area** → your domain → **Nameservers** (sometimes under
"Manage Domain" or "Private Nameservers"), replace all three cloudoon entries
with:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Then in Vercel: **Settings → Domains → Add** → `biziirise.com`. With Vercel
nameservers it creates the apex and `www` records itself — no A or CNAME to copy
by hand.

**Why this rather than fixing the zone at Truehost:** it sidesteps the broken
zone completely, it puts DNS next to the deployment so there is one place to
look, and apex records stop being a special case. The trade-off is that any
future email records — the Resend DKIM and SPF entries, or Google Workspace MX —
get added in Vercel rather than Truehost. That is a fair trade and arguably
easier.

**Timing:** the domain is brand new, so nothing is cached anywhere. A nameserver
change on a fresh domain usually resolves within an hour or two rather than the
48 hours you see quoted.

### If you would rather stay on Truehost

Open a support ticket asking them to **create the DNS zone** for biziirise.com —
that is the specific thing missing, and saying it that way will save a round of
back-and-forth. Once the zone exists and answers queries, add the A and CNAME
records exactly as Vercel displays them.

**At this point Phase 1 is live and can start producing enquiries.** Everything
below is Phase 2 and can take as long as it takes.

---

## 4 · Supabase  (20 minutes)

1. supabase.com → **New project**. Region: pick the closest — likely
   `eu-central-1` (Frankfurt), which is the shortest hop from Kenya of the
   options usually offered.
2. Save the database password somewhere real. You cannot recover it.
3. **SQL Editor** → run the four migration files in `supabase/migrations/`
   **in numeric order**:
   - `0001_core.sql`
   - `0002_automation.sql`
   - `0003_rls.sql`
   - `0004_seed_sequences.sql`

   All four have been applied to a real Postgres 16 and the RLS policies tested
   with two separate client users, so they should run without argument. If one
   errors, stop and send me the message rather than editing around it.

4. **Settings → API** gives you three values. Put them in Vercel's environment
   variables and in a local `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

   **The service role key bypasses every security policy in the database.** It
   must never get a `NEXT_PUBLIC_` prefix, never be pasted into a client
   component, and never leave your password manager and Vercel.

5. **Authentication → URL Configuration:**
   - Site URL: `https://biziirise.com`
   - Redirect URLs: add `https://biziirise.com/auth/confirm` and
     `https://biziirise.com/auth/callback`

   Magic links will not work without this.

6. **Authentication → Providers → Email:** turn **off** "Enable sign ups".
   Clients do not self-register — you create their account when a project
   starts. The login form already refuses to create users, but the setting is
   the real lock.

Redeploy Vercel after adding the variables. The portal switches itself on.

## 5 · Make yourself the admin  (2 minutes)

After you have signed in once so your auth user exists:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

Your user id is in **Authentication → Users**.

## 6 · Add your first client  (5 minutes)

```sql
-- 1. the business
insert into clients (name, company, email, whatsapp_phone)
values ('Skinner''s Restaurant', 'Skinner''s Restaurant & Butchery',
        'owner@example.co.ke', '254712345678');

-- 2. invite them: Authentication → Users → Invite user, using that email

-- 3. link their login to the business
update profiles
set client_id = (select id from clients where name = 'Skinner''s Restaurant')
where id = '<their-user-id>';

-- 4. give them something to look at
insert into projects (client_id, name, summary, status)
values ((select id from clients where name = 'Skinner''s Restaurant'),
        'Kitchen dashboard', 'Order routing and staff roles.', 'in_progress');
```

Then sign in as them and confirm they see their project and nothing else. Do
this with two clients before you invite a real one — the policies are tested,
but you should see the isolation with your own eyes.

---

## The long pole, which you should start today

**Meta Business verification**, for the WhatsApp Cloud API. Days to weeks, and
everything in Phase 4 waits behind it. It costs nothing to start and it is the
only queue you cannot shorten later.

Also worth starting now because they queue: **Safaricom Daraja** (a Paybill or
Till in the business name) and **Resend domain verification** (DKIM and SPF
records at your registrar — you will already be in there doing DNS).

None of these block Phases 1, 2 or 3. They only bite if you start them late.
