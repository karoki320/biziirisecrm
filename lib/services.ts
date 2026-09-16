/**
 * Single source of truth for what Biziirise sells.
 *
 * Every price on the site comes from here — the homepage cards, the services
 * index and each detail page. Change a number once and it changes everywhere.
 * Prices are in KES. `cadence: "month"` marks a recurring retainer.
 */

export type Pkg = {
  name: string;
  price: number | null; // null = quoted per project
  cadence?: "once" | "month";
  summary: string;
  features: string[];
  highlight?: boolean;
};

export type Service = {
  slug: string;
  title: string;
  /** Homepage card copy — short. */
  cardBlurb: string;
  /** Shown under the price on cards and index rows. */
  priceHint: string;
  /** Detail page standfirst. */
  tagline: string;
  intro: string;
  process?: { title: string; body: string }[];
  packages: Pkg[];
  packagesNote?: string;
  addOns?: Pkg[];
};

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function priceLabel(pkg: Pkg): string {
  if (pkg.price === null) return "Quoted per project";
  return pkg.cadence === "month"
    ? `${formatKes(pkg.price)}/month`
    : formatKes(pkg.price);
}

export const services: Service[] = [
  {
    slug: "websites",
    title: "Company profile websites",
    cardBlurb:
      "The site that makes a serious business look serious. Live in days, not months.",
    priceHint: "From KES 10,000",
    tagline:
      "A company profile website that makes you look like the business you already are.",
    intro:
      "Most Kenyan businesses lose work before the first conversation — a client searches, finds nothing credible, and calls someone else. A company profile site fixes that. It is the cheapest thing we build and usually the fastest to pay for itself.",
    process: [
      {
        title: "We take your content",
        body: "Your services, your photos, your numbers. If you do not have copy, we write it from a single conversation.",
      },
      {
        title: "We build and show you",
        body: "You see the real site on a link, on your phone, before anything goes live. Two rounds of changes are included.",
      },
      {
        title: "We launch and hand over",
        body: "Domain pointed, Google set up, WhatsApp button working. You own everything — the domain, the hosting, the files.",
      },
    ],
    packages: [
      {
        name: "3-page",
        price: 10000,
        cadence: "once",
        summary: "Home, About, Contact. Everything a client needs to trust you and reach you.",
        features: [
          "Three pages, written and designed",
          "Mobile-first — most of your visitors are on a phone",
          "WhatsApp button on every page",
          "Google Search setup: titles, descriptions, sitemap",
          "Your contact details, map and social links",
          "Two rounds of changes",
        ],
      },
      {
        name: "6-page",
        price: 20000,
        cadence: "once",
        highlight: true,
        summary: "Room for your services, your work and a blog that brings people in from Google.",
        features: [
          "Everything in the 3-page package",
          "Individual pages for your services",
          "Gallery or portfolio section",
          "Blog you can post to, so Google has something to rank",
          "Enquiry form as well as the WhatsApp button",
          "Google Analytics connected",
        ],
      },
    ],
    packagesNote:
      "Both packages are one-off. Domain and hosting are billed separately at cost — we do not mark them up.",
  },

  {
    slug: "ecommerce",
    title: "Ecommerce",
    cardBlurb:
      "Sell online with M-Pesa checkout and WhatsApp ordering, managed from one dashboard.",
    priceHint: "From KES 35,000",
    tagline: "An online shop your customers pay for with M-Pesa and order over WhatsApp.",
    intro:
      "An Instagram page is not a shop. You are answering the same three questions in DMs all day, losing orders overnight, and you have no record of what actually sells. A proper store takes payment while you sleep and tells you every month what to stock more of.",
    process: [
      {
        title: "We set up your catalogue",
        body: "Products, prices, photos, variants. You send a list or a spreadsheet and we do the loading.",
      },
      {
        title: "We wire up payment and delivery",
        body: "M-Pesa checkout through Daraja, your delivery rates, your areas. A customer pays on their phone and the order lands in your dashboard.",
      },
      {
        title: "We train you on the dashboard",
        body: "Adding products, changing prices, marking orders delivered. It is built so you never need to call us to run your own shop.",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 35000,
        cadence: "once",
        summary: "A real shop with real payment. For a business moving off Instagram DMs.",
        features: [
          "Up to 30 products",
          "M-Pesa checkout — customer pays on their handset",
          "WhatsApp enquiry button on every product",
          "Admin dashboard: add and edit products, view orders",
          "One flat delivery rate",
          "Mobile-first design and Google Search setup",
        ],
      },
      {
        name: "Standard",
        price: 60000,
        cadence: "once",
        highlight: true,
        summary: "For a shop with a real catalogue — sizes, colours, delivery zones and repeat customers.",
        features: [
          "Everything in Basic",
          "Up to 200 products with variants — size, colour, weight",
          "Delivery zones at different rates",
          "Discount codes and promotions",
          "Customer accounts with order history",
          "Order status updates sent over WhatsApp",
          "Sales dashboard: best sellers, revenue by month",
        ],
      },
      {
        name: "Premium",
        price: 120000,
        cadence: "once",
        summary: "For a business where the shop is the business, and stock and staff both need managing.",
        features: [
          "Everything in Standard",
          "Unlimited products, bulk upload from a spreadsheet",
          "Stock management with low-stock alerts",
          "Product feed synced to your Instagram and Facebook shop",
          "Abandoned-cart follow-up over WhatsApp",
          "Automatic invoices and receipts",
          "Staff accounts with separate permissions",
          "Three months of support and training after launch",
        ],
      },
    ],
    packagesNote:
      "One-off build cost. M-Pesa Daraja needs a Paybill or Till in your business name — we handle the application with you.",
  },

  {
    slug: "digital-marketing",
    title: "Digital marketing",
    cardBlurb:
      "Content, production and posting across every platform — run as a sales funnel, not a schedule.",
    priceHint: "From KES 20,000/month",
    tagline:
      "We produce it, we post it, we manage it, and every month we show you what it did.",
    intro:
      "Posting is not marketing. Most businesses post consistently and sell nothing, because the content was never built to move anyone anywhere. We treat your social platforms as a funnel: content that makes people aware of you, content that teaches them why it matters, and content that asks for the sale.",
    process: [
      {
        title: "We audit what you already have",
        body: "Every platform you are on, what is working and what is not. Not a guess — the numbers your accounts already hold.",
      },
      {
        title: "We build the funnel",
        body: "Three kinds of content, deliberately mixed: brand awareness to reach people who have never heard of you, educational content to make them trust you, and direct sales content to convert the ones who are ready.",
      },
      {
        title: "We produce from scratch",
        body: "Shot and edited by us. Nothing recycled, nothing stock, nothing that looks like every other page in your category.",
      },
      {
        title: "We execute and manage",
        body: "We post it, across all your platforms, on schedule. Comments and DMs handled, so enquiries do not sit unread for three days.",
      },
      {
        title: "We report every month",
        body: "What went out, what reached people, what converted, and what we are changing next month because of it.",
      },
    ],
    packages: [
      {
        name: "5 a week",
        price: 20000,
        cadence: "month",
        summary: "Enough volume to stay in front of your audience week after week.",
        features: [
          "5 videos every week",
          "2 static posts every week",
          "Posted across all your platforms",
          "Production from scratch — shot, edited, curated",
          "Comments and DMs managed",
          "Monthly performance report",
        ],
      },
      {
        name: "8 a week",
        price: 35000,
        cadence: "month",
        highlight: true,
        summary: "For a business that wants to own its category rather than keep up with it.",
        features: [
          "8 videos every week",
          "3 static posts every week",
          "Everything in the 5-a-week package",
          "Priority turnaround on time-sensitive content",
          "Content shaped around your promotions and launches",
        ],
      },
    ],
    packagesNote:
      "Monthly retainers, billed month to month. No lock-in contract — if a month does not earn its keep, you stop.",
    addOns: [
      {
        name: "Meta ads management",
        price: 5000,
        cadence: "month",
        summary: "We build, run and optimise your Facebook and Instagram campaigns.",
        features: [
          "Campaign setup, targeting and creative",
          "Ongoing optimisation against your goal",
          "Reported alongside your monthly organic numbers",
          "Ad spend is paid by you directly to Meta — we never hold your budget",
        ],
      },
    ],
  },

  {
    slug: "custom-builds",
    title: "Custom builds",
    cardBlurb:
      "AI automation, CRM systems, client portals and the integrations that tie them together.",
    priceHint: "Quoted per project",
    tagline:
      "The systems that only exist because your business needed them to.",
    intro:
      "Some problems do not fit a package. A booking system your staff actually use. A CRM that matches how you really sell. Automation that answers, sorts and follows up while you sleep. These are scoped and quoted properly, because pretending otherwise helps nobody.",
    process: [
      {
        title: "We map what actually happens",
        body: "Not what the process is supposed to be — what your team really does, including the WhatsApp groups and the spreadsheet nobody admits to.",
      },
      {
        title: "We scope and quote",
        body: "A fixed scope and a fixed price before any code. You will know what you are getting and what it costs.",
      },
      {
        title: "We build in stages",
        body: "You see working software early and often, so a wrong assumption costs a week rather than the project.",
      },
    ],
    packages: [
      {
        name: "AI automation",
        price: null,
        summary: "Pipelines that draft replies, sort enquiries and follow up without anyone remembering to.",
        features: [
          "Lead replies drafted for you to approve",
          "Automatic follow-up sequences by email and WhatsApp",
          "Documents read, sorted and filed",
          "Built into the tools you already use",
        ],
      },
      {
        name: "CRM and client portals",
        price: null,
        summary: "One place for your leads, jobs, documents and invoices — and a login for your clients.",
        features: [
          "Lead and client records with a pipeline view",
          "Client login for documents and project status",
          "Invoices with M-Pesa payment",
          "Activity history on every client",
        ],
      },
      {
        name: "WhatsApp & M-Pesa integrations",
        price: null,
        summary: "Connect the two tools every Kenyan business already runs on to the system you actually use.",
        features: [
          "Order and status notifications over WhatsApp",
          "M-Pesa Daraja payments and reconciliation",
          "Inbound WhatsApp messages into your CRM",
          "Works with what you have — we do not force a rebuild",
        ],
      },
    ],
    packagesNote:
      "Every custom build starts with a conversation and ends with a fixed quote. The conversation is free.",
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
