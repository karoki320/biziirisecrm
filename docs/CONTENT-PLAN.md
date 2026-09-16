# Blog research and content plan

Research done 16 Sep 2026 against live Kenyan search results and the pages
currently ranking. AnswerThePublic is gated behind a paywall, so this uses the
next best thing: what actually ranks, what those pages cover, and — more
usefully — what they all leave out.

## What the research found

**1. "Website cost Kenya" is saturated.** At least nine Kenyan agencies have a
2026 pricing guide. You will not out-rank them on the head term with one post.
What you *can* do is own it with a genuinely different angle, which is what the
first article does.

**2. None of the top pages has FAQ schema.** Not one. The two strongest pages we
examined have no FAQ section at all. Every post here ships `FAQPage` structured
data, which is the cheapest available rich-result win in this market.

**3. Nobody publishes the M-Pesa timelines.** Every guide explains STK push;
none states how long Daraja go-live actually takes. That is the single most
useful unanswered question in the category and it is now article two.

**4. The price gap is the story.** See below — it is the most valuable thing the
research turned up, and it is not really an SEO finding.

## The price gap — read this one

Kenyan agencies publish these ranges:

| | Published market | Biziirise |
|---|---|---|
| Landing page | KES 25,000 – 60,000 | — |
| Small business site 3–5 pages | KES 50,000 – 120,000 | **10,000 (3pp) / 20,000 (6pp)** |
| Corporate site 6–15 pages | KES 100,000 – 280,000 | 20,000 |
| Online shop | KES 100,000 – 400,000 | **35,000 – 120,000** |
| Maintenance retainer | KES 5,000 – 20,000/month | not offered |

You are at roughly **a fifth of the published market rate** on websites and the
bottom of the range on ecommerce.

That is either your sharpest weapon or a serious mistake, and it is worth
deciding which on purpose rather than by default:

- **If it is deliberate** — win on volume, undercut everyone, build a portfolio
  fast — then the pricing article leans into it hard, which is how it is written.
- **If it is not** — if you are pricing off what you think Kenyan SMEs will pay
  rather than what the work is worth — then you are leaving real money on the
  table. A 6-page site at 20,000 against a market that publishes 50,000–120,000
  suggests room to move, and the case studies on `/work` are the evidence that
  would justify it.

Two things worth noticing. Published ranges are what agencies *advertise*, not
necessarily what they *get* — the real market is likely softer. And competing on
being cheapest is the one position anyone can take from you tomorrow, whereas
"the agency that builds on the same stack it sells" cannot be copied quickly.

Not a decision to take from a blog post. But make it deliberately.

## What shipped

Five posts, each mapped to a service and each carrying FAQ schema.

| Post | Target keyword | Feeds |
|---|---|---|
| What a website actually costs in Kenya | website cost Kenya | `/services/websites` |
| M-Pesa on your website: Till or Paybill | M-Pesa integration website Kenya | `/services/ecommerce` |
| Instagram shop or a real online store? | Instagram shop vs website Kenya | `/services/ecommerce` |
| What social media management costs | social media management cost Kenya | `/services/digital-marketing` |
| WhatsApp Business API in Kenya | WhatsApp Business API Kenya | `/services/custom-builds` |

Each one publishes your actual prices. That is the strategy: in a category where
everyone says "contact us for a quote", the page with real numbers is the one
people send to their business partner.

## Publishing cadence

All five are dated today, which is honest — they are going live together. But
Google reads a site that publishes steadily as more alive than one that dumps
five posts and goes quiet for six months.

If you would rather stagger: keep two in `content/blog/` now, move the other
three out, and add one back each week with its date updated. The pipeline picks
up whatever files are present at build time.

## The next ten, in priority order

Ranked by how winnable they are, not by search volume. A specific question with
low volume that you can actually rank for beats a head term you cannot.

1. **"How long does it take to build a website in Kenya?"** — a natural FAQ
   expansion, and it maps to the objection that stalls most deals.
2. **"Why isn't my website showing on Google?"** — high frustration, high intent,
   and the answer is usually something you can fix in an afternoon.
3. **"Do I own my domain? How to check before it becomes a problem."** — nobody
   in Kenya writes this and it happens constantly.
4. **"What to ask a web developer before you pay a deposit."** — the buyer's
   checklist. Gets shared, which is how it earns links.
5. **"M-Pesa reconciliation: matching payments to orders automatically."** —
   deeper than article two, for the reader who already has a Till.
6. **"How much should a Kenyan SME spend on Meta ads to start?"** — attaches to
   your KES 5,000 add-on.
7. **"WhatsApp order forms: what actually works for a small shop."**
8. **"Hosting in Kenya: local vs international, and does it matter for SEO?"**
9. **"Your Instagram bio link is costing you sales."** — short, sharable,
   feeds ecommerce.
10. **"What a CRM is for, if you are a business of three people."** — feeds
    custom builds, and it is the softest of the ten.

## Where the SEO is already handled

Every post automatically gets:

- `BlogPosting`, `BreadcrumbList` and `FAQPage` structured data
- A canonical URL, meta description, keywords and `og:type: article`
- Published and modified timestamps
- An entry in `sitemap.xml`
- One contextual internal link into the service page it feeds
- Semantic headings — exactly one `h1`, the rest `h2`
- Static prerendering, so Core Web Vitals stay where they are

## Adding a post

Drop a `.md` file in `content/blog/`. Frontmatter:

- `title`, `description`, `date` — required
- `keyword` — the one term this post targets. One per post; two posts chasing the
  same term compete with each other rather than with anybody else.
- `keywords` — supporting terms
- `service` — a slug from `lib/services.ts`, which renders the internal link card
- `faqs` — a list of `q` and `a`. This is what produces the FAQ schema, so it is
  the highest-value part of the file. Five is a good number.
