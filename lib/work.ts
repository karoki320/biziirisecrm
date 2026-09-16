/**
 * Case studies for /work.
 *
 * Mirrors `lib/services.ts` — this is the Phase 1 source of truth. In Phase 3
 * it moves to the `case_studies` table, where the same rule is enforced by a
 * database constraint: nothing publishes without a recorded sign-off.
 *
 * `signoff` is deliberately not a boolean. "It is already on my personal
 * portfolio" is not the same permission as "this client said yes in writing",
 * and the difference should be visible in the code rather than forgotten.
 */

export type Signoff = "written" | "public-portfolio" | "pending";

export type CaseStudy = {
  slug: string;
  client: string;
  sector: string;
  location: string;
  /** One line, in the client's terms, about what they actually got. */
  summary: string;
  scope: string[];
  stack: string[];
  /** null when there is no live URL we are willing to link to. */
  url: string | null;
  urlNote?: string;
  signoff: Signoff;
  published: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "skinners-restaurant",
    client: "Skinner's Restaurant & Butchery",
    sector: "Restaurant",
    location: "Gachie, Nairobi",
    summary:
      "A full restaurant operating system — M-Pesa checkout, WhatsApp order routing, and a role-based kitchen dashboard that keeps the front and back of house in sync.",
    scope: [
      "Online menu and ordering",
      "M-Pesa checkout",
      "Orders routed to WhatsApp",
      "Kitchen dashboard with staff roles",
    ],
    stack: ["Next.js", "Supabase", "M-Pesa Daraja", "WhatsApp Cloud API", "RBAC"],
    url: "https://www.skinnersrestaurant.com",
    signoff: "public-portfolio",
    published: true,
  },
  {
    slug: "jonathan-law-advocates",
    client: "Jonathan Law Advocates",
    sector: "Legal",
    location: "Nairobi, with offices in Mwea and Embu",
    summary:
      "A full Next.js app built properly under the hood — CSP, HSTS, rate limiting, CSRF protection and Supabase row-level security throughout.",
    scope: [
      "Twelve practice areas, each with its own page",
      "Security headers and rate limiting",
      "Row-level security on every table",
      "Multi-office contact routing",
    ],
    stack: ["Next.js", "Supabase RLS", "CSP / HSTS", "Rate limiting"],
    url: "https://www.jonathanlawadvocates.com",
    signoff: "public-portfolio",
    published: true,
  },
  {
    slug: "scent-city-perfumes",
    client: "Scent City Perfumes",
    sector: "Ecommerce",
    location: "Thika",
    summary:
      "A fragrance store that feels as premium as the scents — M-Pesa checkout, wishlists, and product pages that sell.",
    scope: [
      "Catalogue across women's, men's and Arabian fragrances",
      "M-Pesa checkout",
      "Wishlists and saved items",
      "Countrywide delivery rates",
    ],
    stack: ["Next.js", "Ecommerce", "M-Pesa Daraja", "SEO"],
    url: "https://www.scentcityperfumes.com",
    signoff: "public-portfolio",
    published: true,
  },
  {
    slug: "vimax-business-tours",
    client: "Vimax Business Tours",
    sector: "Travel",
    location: "Cianda House, Nairobi",
    summary:
      "A site for a business that sells trust before it sells a trip — Kenyan entrepreneurs sourcing from Chinese factories, who need to believe in the operator before they book.",
    scope: [
      "Tour packages, group and private",
      "Sourcing categories from electronics to mitumba",
      "Enquiry form that captures product and budget up front",
      "WhatsApp booking as the primary route",
    ],
    stack: ["Next.js", "Lead capture", "WhatsApp CTA", "SEO"],
    url: "https://www.vimaxbusinesstours.com",
    signoff: "public-portfolio",
    published: true,
  },
  {
    slug: "njindo-matiba-advocates",
    client: "Njindo Matiba & Co. Advocates",
    sector: "Legal",
    location: "Meru",
    summary:
      "Brand and website for an advocates' practice — measured, trustworthy, and easy for clients to reach.",
    scope: [
      "Brand identity and website",
      "Six practice areas",
      "Search setup for a regional practice",
      "WhatsApp as the primary contact route",
    ],
    stack: ["Next.js", "Brand identity", "SEO", "WhatsApp CTA"],
    url: "https://www.njindomatibaadvocates.com",
    signoff: "public-portfolio",
    published: true,
  },
  {
    slug: "rev-jane-githaiga",
    client: "Rev. Jane Mwihaki Githaiga",
    sector: "Ministry",
    location: "Nairobi",
    summary:
      "A warm, mobile-first home for a ministry and the person behind it — built to feel personal and reach people where they are.",
    scope: [
      "Her story told as a timeline, not a biography page",
      "Testimonies, reflections and a ministry gallery",
      "Giving by M-Pesa and Equity paybill",
      "Prayer requests straight to WhatsApp",
    ],
    stack: ["Brand identity", "Ministry platform", "M-Pesa giving", "Mobile-first"],
    url: "https://www.revjanemwihakigithaiga.com",
    signoff: "public-portfolio",
    published: true,
  },
];

export const published = caseStudies.filter((c) => c.published);

export const awaitingSignoff = caseStudies.filter(
  (c) => c.published && c.signoff !== "written",
).length;
