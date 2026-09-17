# Your side of the parallel track

> **Looking for what to do next? Read `PROGRESS.md` in the project root instead.**
> This file is the reference manual — the detail behind each step. Come here when
> PROGRESS.md points you at a section, not to find your place.

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

## 6 · Add your first client  (2 minutes, no SQL)

You asked for this and you were right to: adding a client should not mean
opening Supabase. It doesn't any more.

1. Sign in and go to **/admin/clients**.
2. Fill in **Add a client**. Only the name is required — company, email, phone,
   WhatsApp number and notes can all come later.
3. Open the client and use **Portal access → Invite**. That sends them a
   Supabase invite email, creates their login, and links it to this business in
   one step. If they already have an account, it links that one instead of
   failing.
4. **Remove access** on the same panel revokes a login without deleting the
   person or the business.

Everything about a client — details, projects, invoices, documents — is
editable from that page. The only thing still worth doing in Supabase is
promoting yourself to admin (step 5), because that is a one-time act and a
button for it would be a button for escalating your own privileges.

**Do this twice before you invite a real client.** Make two businesses, invite
two logins, sign in as each, and see with your own eyes that neither can see the
other's projects. The RLS policies are tested against a real Postgres — eleven
behavioural checks, including two-client isolation — but a tested policy and a
policy you have watched hold are different kinds of confidence.

---

## The long pole, which you should start today

**Meta Business verification**, for the WhatsApp Cloud API. Days to weeks, and
everything in Phase 4 waits behind it. It costs nothing to start and it is the
only queue you cannot shorten later.

Also worth starting now because they queue: **Safaricom Daraja** (a Paybill or
Till in the business name) and **Resend domain verification** (DKIM and SPF
records at your registrar — you will already be in there doing DNS).

None of these block Phases 1, 2 or 3. They only bite if you start them late.

---

## 7 · Switching on M-Pesa  (built, **paused** until your Safaricom docs are in)

> **Status: paused at your request.** Nothing needs undoing. The code is
> written and deployed, and with no credentials set it simply refuses to send
> a prompt and says so. Come back to this section the day Daraja approves you.

The CRM can already send an STK prompt from any invoice. It needs four things
from Safaricom before it will do anything but error politely.

In Vercel's environment variables:

```
MPESA_ENV=sandbox            # then "production" when you go live
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=             # your Paybill or Till
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://www.biziirise.com/api/webhooks/mpesa
```

**The callback URL must be registered with Safaricom**, not just set here. They
will only POST to a URL you have declared, over HTTPS, publicly reachable. Ours
is live at that address now and answers `200` to anything — which is deliberate,
see below.

### Test in sandbox first, with real money later

1. Set `MPESA_ENV=sandbox` and use the sandbox credentials.
2. Create a test client and a small invoice, send yourself a prompt.
3. Watch the payment row move from `pending` to `success` on the invoices page.
4. Only then switch to production and do one real KES 10 transaction.

### Why the callback always answers 200

Safaricom retries anything that is not a `200`. A handler that is already
struggling gets a retry storm on top, which turns a small problem into an
outage. So the route accepts everything, records what it can, and handles our
own failures on our side. Three properties it holds:

- **Idempotent.** A callback that lands twice cannot credit an invoice twice —
  we only act on a payment still `pending`.
- **Reconciles by sum, not by increment.** `paid_kes` is recalculated from all
  successful payments, so a replay or a manual correction cannot cause drift.
- **Keeps the raw payload.** The first time a client disputes a payment, the
  field you did not store is the one you need.

### What is deliberately not automatic

Marking an invoice paid by hand. If money arrives some other way — cash, a bank
transfer, a Send Money to your personal number — record it in the client's notes
and adjust the invoice in Supabase. Building a manual-payment path invites
someone to mark things paid that were not.

---

## 8 · WhatsApp Cloud API  (start today — the queue is the slow part)

### Why this matters more than it looks

Every CTA on the site opens WhatsApp with a message already typed. That is the
right call for conversion — nobody fills in a form on a phone at 9pm — but it
means a lead arrives in your pocket and nowhere else. No record, no follow-up
list, no idea which page produced it. That gap has been open since day one.

The inbound webhook closes it. Once Meta approves the number, every first
message from a new person becomes a row in `leads`, with the page that sent them
already attached — because the pre-filled text carries it in brackets, and the
webhook reads it back out.

### What is already built

`/api/webhooks/whatsapp` is live and deployed. It:

- answers Meta's one-time `GET` verification handshake with the challenge;
- **rejects any `POST` that is not signed by Meta** with your app secret. Without
  this, anyone who found the URL could write rows into your CRM;
- creates a lead from a first inbound message, with name, number, the message
  body and the page context;
- recognises an existing client by WhatsApp number and logs the message against
  them instead of inventing a duplicate lead;
- touches `last_contacted_at` on a lead that already exists rather than creating
  a second one;
- always answers `200`, for the same reason the M-Pesa callback does — Meta
  retries failures, and a retry storm on a struggling handler is how a small
  problem becomes an outage.

Outbound sending (`lib/whatsapp.ts`) is written too: templates for proactive
messages, free text for replies inside the 24-hour window, and a Kenyan number
normaliser that handles `07xx`, `+2547xx` and `2547xx`.

### Your side, in order

**1. Meta Business verification.** *Start this today.* business.facebook.com →
Business Settings → Security Centre → Start Verification. You will need a
certificate of incorporation or business permit, and a utility bill or bank
letter showing the business name and address. Days to weeks, and you cannot
shorten it later. Everything below waits behind it.

**2. Create a Meta app.** developers.facebook.com → My Apps → Create App →
**Business** type → add the **WhatsApp** product.

**3. The number.** Use a number that is *not* on WhatsApp Business already —
migrating an existing one means losing the chat history on the phone. If your
current business number is the one on the website, think about this before you
move it. Meta gives you a free test number to develop against in the meantime.

**4. Copy four values into Vercel** (Settings → Environment Variables, all
environments):

```
WHATSAPP_PHONE_NUMBER_ID=      # WhatsApp → API Setup
WHATSAPP_BUSINESS_ACCOUNT_ID=  # same page
WHATSAPP_ACCESS_TOKEN=         # see the warning below
WHATSAPP_VERIFY_TOKEN=         # you invent this — any long random string
WHATSAPP_APP_SECRET=           # App Settings → Basic → App Secret → Show
```

> **The access token is the one that will catch you out.** The token on the API
> Setup page expires in **24 hours**. It is for testing only. For production you
> need a **System User token**: Business Settings → Users → System Users → Add
> → give it Admin on the app and the WhatsApp account → Generate token → set
> expiry to **Never** → scopes `whatsapp_business_messaging` and
> `whatsapp_business_management`. If messages silently stop working a day after
> you set this up, this is why.

**5. Wire the webhook.** In the Meta app: WhatsApp → Configuration → Webhook →
Edit.

```
Callback URL:  https://www.biziirise.com/api/webhooks/whatsapp
Verify token:  <the same WHATSAPP_VERIFY_TOKEN you set in Vercel>
```

Then **Manage → subscribe to `messages`**. Without that subscription the
handshake succeeds and nothing ever arrives — a genuinely confusing failure,
because everything looks green.

Deploy to Vercel *before* you click Verify. The handshake hits the live URL, and
it cannot succeed against a deployment that doesn't have the token yet.

**6. Test it.** Message your own business number from your personal phone. A new
lead should appear at **/admin/leads** within a second or two. Send a second
message — you should still have exactly one lead.

### Templates, and the rule that governs everything else

You may send free-form text only within **24 hours** of the person's last
message to you. Outside that window, every message must be a template Meta has
approved in advance. This is not a limit you can engineer around, and it shapes
what automation is possible: a "your invoice is ready" notification is a
template, submitted and approved days earlier. Approval is usually hours.

Three worth submitting first, under Manage Templates:

- `invoice_ready` — utility — *"Hi {{1}}, your invoice for {{2}} is ready. KES
  {{3}}. Pay by M-Pesa or view it in your portal: {{4}}"*
- `project_update` — utility — *"Hi {{1}}, {{2}} has moved to {{3}}. Details in
  your portal: {{4}}"*
- `lead_followup` — marketing — *"Hi {{1}}, Eugene from Biziirise. You asked
  about {{2}} a few days ago — still useful to talk?"*

Write them as a person would speak. Templates that read like a bank get rejected
more often than templates that read like a message, and they perform worse when
they pass.

### Costs, so there are no surprises

Meta charges per 24-hour conversation, not per message, and the price depends on
who opened it. A conversation the *customer* starts is currently free for the
first 1,000 a month. A *business-initiated* one (your invoice notification) is
billed at the Kenya rate — low single-digit US cents for utility, more for
marketing. At your volume this is a few hundred shillings a month at most, but
it is a real cost, and it scales with how chatty your automation is.

---

## 9 · Resend  (30 minutes, and worth doing before the WhatsApp queue clears)

### Two jobs, not one

Resend sends your transactional email — invoice notifications, project updates.
That is the obvious job. The second one is less obvious and matters sooner:
**Supabase's built-in mailer is rate-limited to a handful of messages per hour**
and sends from a Supabase address. Every portal invite you send goes through it.
Point Supabase at Resend as its SMTP provider and invites arrive from
`biziirise.com`, look like you sent them, and stop landing in spam.

### Your side, in order

**1. Sign up and verify the domain.** resend.com → Domains → Add Domain →
`biziirise.com`. Resend gives you three records to add wherever your DNS lives
(Vercel, if you moved the nameservers in step 3 — Project → Settings → Domains
→ the DNS records tab):

| Type | Name | Purpose |
|---|---|---|
| TXT | `resend._domainkey` | DKIM — signs your mail so it isn't forged |
| MX | `send` | bounce and complaint handling |
| TXT | `send` | SPF — declares Resend may send as you |

Verification is usually minutes. If it stalls past an hour, the record almost
always has the domain appended twice — `resend._domainkey.biziirise.com.biziirise.com`
— which is the single most common DNS mistake there is.

**Use a subdomain if you ever plan to send marketing email.** `send.biziirise.com`
for transactional keeps your root domain's reputation separate, so a campaign
that gets marked as spam cannot stop invoices from being delivered. If all you
will ever send is transactional mail, the root domain is fine.

**2. Set the keys in Vercel:**

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Biziirise <hello@biziirise.com>
RESEND_REPLY_TO=hello@biziirise.com     # optional, if replies should go elsewhere
```

The display name is not decoration. `Biziirise <hello@biziirise.com>` gets opened;
a bare address looks automated, because it is.

**3. Point Supabase at Resend.** Supabase → Project Settings → Authentication →
SMTP Settings → Enable Custom SMTP:

```
Host:      smtp.resend.com
Port:      465
Username:  resend
Password:  <your Resend API key>
Sender:    hello@biziirise.com
Sender name: Biziirise
```

Then Authentication → Rate Limits → raise the email limit, which exists only
because of the built-in mailer.

**4. While you are in that screen — turn OFF "Enable sign ups."** Your clients
never register themselves; you invite them. Leaving sign-ups on means anyone who
finds `/login` can create an account. They would land in a portal with no client
attached and see nothing, because RLS holds — but an account they should not
have is still an account they should not have.

**5. Test.** Invite yourself at a personal address from **/admin/clients**. The
mail should arrive from `biziirise.com`, in the inbox rather than spam, and the
link should log you in.

### One thing to do once and forget

Send a test to a Gmail address and open **Show original**. You want `SPF: PASS`,
`DKIM: PASS`, `DMARC: PASS`. If DMARC fails, you have no DMARC record — add a
TXT at `_dmarc` with `v=DMARC1; p=none; rua=mailto:hello@biziirise.com`. `p=none`
only asks for reports; it changes nothing about delivery. Once you have watched
the reports for a few weeks and nothing unexpected is sending as you, move to
`p=quarantine`.

You are a dev agency. Your own mail authentication passing is the kind of thing a
technical client checks.
