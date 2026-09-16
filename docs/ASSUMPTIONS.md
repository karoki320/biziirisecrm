# Assumptions I made — correct me now, not after the build

Ordered by how expensive they are to reverse later.

---

### 1. Automation runs on a cron-drained queue, not database→HTTP calls
**Assumed:** DB trigger creates an enrolment row; a Vercel Cron every 5 minutes
calls `/api/automation/run` to send. No `pg_net`, no edge functions.
**Why:** pausing, retrying and logging all become row state the admin panel
already reads. Full reasoning in `docs/BUILD-PLAN.md`.
**Cost to reverse:** low now, high once Phase 4 is built.
**If you disagree:** say so before Phase 4 starts.

---

### 2. The `wa.me` CTA creates no lead record — and that is a real gap
**Assumed:** you accept that, until the WhatsApp Cloud API webhook is live, every
lead is typed into the CRM by hand.
**Why it matters:** "no form-filling" is the right call for conversion, but it
means the homepage produces zero attributable data. You will not know which page
or campaign produced a client.
**Partial mitigation already built:** each CTA appends its placement to the
pre-filled message — a lead's first message reads *"Hi Biziirise, I'd like to talk
about a project (Homepage hero)"*. Crude, but it survives into your WhatsApp
thread and tells you where they came from.
**Real fix:** Phase 4's inbound WhatsApp webhook auto-creates the `lead` row with
`page_context` parsed out of that first message. This is the strongest argument
for starting Meta verification today.

---

### 3. One Next.js app, one Vercel project
**Assumed:** marketing (`/`), portal (`/portal`) and admin (`/admin`) are route
groups in a single deployment, gated by `proxy.ts` and RLS.
**Why:** shared components, one deploy, one domain, one set of secrets. Splitting
them is a scaling decision you do not have a scaling problem for.
**Reverse later:** moderate — extracting admin into its own app is a day's work.

---

### 4. Blog posts are MDX files in the repo, not database rows
**Assumed:** the blog is not editable from the admin panel. You write a `.mdx`
file, push, it deploys.
**Why:** statically rendered, zero query cost, best possible Core Web Vitals on
exactly the pages Google measures. A database-backed blog buys you editing
convenience you probably do not need for a post a fortnight.
**Reverse later:** moderate. Say now if you want to write posts from `/admin`.

---

### 5. The primary CTA is brand sky blue, not WhatsApp green
**Assumed:** the big button uses your brand sky blue with a WhatsApp glyph, rather
than WhatsApp's `#25D366`.
**Why:** the brief specifies one confident accent for CTAs, and WhatsApp green
fails contrast with white text (1.8:1 — well under the 4.5:1 floor). Green would
need dark text on it, which reads as a warning banner on cream.
**Reverse later:** trivial — one token.

---

### 6. `staff` role exists in the enum from day one
**Assumed:** the role enum is `admin | staff | client` even though only you use
it. `is_admin()` currently accepts both `admin` and `staff`.
**Why:** you said "extensible to a team role later without a schema rebuild."
Adding an enum value to a live Postgres table is annoying; having it unused costs
nothing. When you hire, differentiating `staff` from `admin` becomes a policy
edit, not a migration.

---

### 7. WhatsApp notifications require pre-approved Meta templates
**Not an assumption — a constraint worth stating plainly.** Outside the 24-hour
window after a client last messaged you, you may only send *approved template
messages*. Free-form text is rejected. So "your project status changed" must be a
template submitted to Meta and approved before Phase 4 can work.
`docs/BUILD-PLAN.md` lists the two templates the seed data expects:
`lead_followup_48h` and `project_status_update`.

---

### 8. Money is `numeric(12,2)` in KES only
**Assumed:** single currency, no FX. Max invoice 9,999,999,999.99.
**Reverse later:** painful once invoices exist. Tell me now if you bill anyone in USD.

---

### 9. Case studies are gated at the database level
**Assumed:** you want the sign-off rule enforced, not remembered. A check
constraint makes it physically impossible to publish a case study without
`client_signoff_at` set. Unsigned entries sit in the CRM flagged, and `/work`
renders without them rather than blocking.
**Reverse later:** trivial, but I would not.

---

### 10. Typography is Plus Jakarta Sans, self-hosted
**Assumed:** one family, loaded through `next/font` so it is served from your own
domain — no Google request, no layout shift.
**Why this one:** geometric enough to read as a tech company, humanist enough to
sit warmly on cream. Neutral alternative: Inter. Warmer: Outfit.
**Reverse later:** trivial.

---

### 11. Toolchain pins
- **TypeScript ^5.9**, not 7.x. TS 7 is out but the Next/ESLint plugin ecosystem
  has not caught up. Revisit in a few months.
- **ESLint ^9**, not 10. `eslint-config-next@16` bundles a version of
  `eslint-plugin-react` that crashes on ESLint 10. Verified, not guessed.
- **`proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention; the old
  name still works but warns on every build.

---

### 12. Things I have deliberately not decided
- **Analytics.** Nothing installed. Vercel Analytics is the zero-config option and
  does not need a cookie banner; Plausible if you want self-serve dashboards.
- **Error tracking.** Nothing installed. Sentry when the portal goes live, not before.
- **Blog content strategy.** Structure exists, topics do not. That is an SEO
  keyword conversation worth having on its own.

---

### 13. Prices are public, on the page
**Assumed:** you want the numbers visible rather than gated behind an enquiry.
**Why:** you gave me the price list, which only makes sense if clients see it. It
also kills a class of wasted WhatsApp conversation — someone with a 10k budget
does not open a conversation about a 120k build.
**Reverses trivially:** the numbers all live in `lib/services.ts`.

---

### 14. The ecommerce tier contents are mine, not yours
**Assumed:** you gave me three prices — 35k / 60k / 120k — and asked me to draft
what separates them. I wrote a scope ladder based on what a Kenyan SME shop
actually needs: product count, variants, delivery zones, stock management,
catalogue sync, staff accounts.
**This is the thing to read first.** Every line is a promise you have to deliver.
I have guessed your delivery capacity, and I would rather you cut two features
than discover mid-build that Premium promised something you do not do.
**Where:** `lib/services.ts`, the `ecommerce` service.

---

### 15. The 35k marketing tier gets 3 static posts
**Assumed:** you said "8 videos" and left statics unstated, so I scaled the 20k
tier's 2 statics to 3, and added priority turnaround plus content shaped around
your promotions — because a tier that differs only in video count is hard to sell
against the cheaper one.
**Correct the static count if it is wrong.** It is one line.

---

### 16. Meta ads at 5k is a monthly management fee
**Assumed:** "the fee is 5k" means 5,000 per month for ongoing campaign
management, not a one-off setup charge. The page says `KES 5,000/month` and
states plainly that ad spend goes from you to Meta directly, never through us.
**If it is a one-off setup fee, tell me** — it changes the label and the pitch.

---

### 17. Custom work is named but not priced
**Assumed:** AI automation, CRM/portals and WhatsApp/M-Pesa integrations stay
visible as a fourth service at "quoted per project" rather than disappearing.
**Why:** it is arguably your differentiator, and no other agency at this price
point can do it. Pricing where you have prices and honest silence where you do
not beats inventing a number.

---

### 18. The logo keeps its own blue; the UI does not borrow it
**Measured, not assumed:** the mark is `#109BFC`. On your cream that is 2.8:1, and
white on it is 2.95:1 — so it cannot be a button, a link or body text without
failing WCAG AA. It stays the mark's colour and nothing else.
**The good news:** all three blues sit within 5° of the same hue (201°–205°), so
`#0B5C87` is effectively a dark, accessible step of the logo blue rather than a
different colour. The palette was already coherent; nobody planned that.
**Token:** `--color-brand` in `app/globals.css`, used only by the logo lockup.

---

### 19. The homepage headline predates the new positioning
**Not fixed, flagged.** The hero still reads *"Software that runs your business
while you run it."* That was written when the offering was web apps, automation
and CRM. Digital marketing is not software, and it is now a third of what you
sell. The subheadline covers all three; the headline does not.
**Say the word and I will rewrite it** — it is the single highest-leverage line on
the site and I would rather you chose the direction than have me guess.

---

### 20. Case studies came from your portfolio, not from client sign-off
**Source:** the five projects on eugenekaroki.netlify.app. Copy is yours, tightened.
**The gap:** `signoff` on each entry is `"public-portfolio"`, not `"written"`. Your
personal site already names these clients publicly, so this is not a new
disclosure — but it is not the same as a client saying yes in writing, and the
code says so rather than pretending otherwise.
**Before you push hard on this page,** get written permission from the ones you
want to lead with. Flip their `signoff` to `"written"` in `lib/work.ts`.

---

### 21. Rev. Jane's correct domain is the long one — RESOLVED
**Was:** `revjanemwihaki.com`, which has no DNS record.
**Is:** `revjanemwihakigithaiga.com`, HTTP 200. The entry is published, the client
name corrected to **Rev. Jane Mwihaki Githaiga**, and the scope expanded from what
the live site actually does — timeline story, testimonies and gallery, giving by
M-Pesa and Equity paybill, prayer requests into WhatsApp.
**Still outstanding on your personal site:** eugenekaroki.netlify.app still points
at the dead short domain. Fix it there too.

---

### 21b. Vimax Business Tours copy is mine, not yours
**Why it differs:** the other five came from your portfolio with your own
descriptions. Vimax was not on it, so I wrote the summary from the live site —
tours to Chinese factories for Kenyan importers, sourcing categories, enquiry form
and WhatsApp booking.
**Deliberately left out:** their KSh 385,000 package price. A client's price on
your site goes stale the moment they change it, and it is not yours to publish.
**Read the summary and make it yours** — it is the only card on the page not
written in your voice.

---

### 22. No outcome numbers anywhere on /work
**Assumed:** scope claims only — what was built, on what stack. No "increased
orders by X%", because I have no data for it and inventing one would be the
single fastest way to lose a client who checks.
**The upgrade when you have it:** one real number per case study ("orders moved
from WhatsApp screenshots to a dashboard; 40 a week now go through it") is worth
more than the entire rest of the card. Ask Skinner's — you have their dashboard.
