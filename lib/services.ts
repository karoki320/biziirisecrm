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
  /**
   * What someone actually types into the finder. Not SEO terms — the words a
   * Nairobi shop owner uses for the thing they want. Sheng and misspellings
   * belong here too: "wesbite" is a real search.
   */
  keywords: string[];
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
    keywords: [
      "website", "web site", "wesbite", "company profile", "profile website",
      "business website", "landing page", "portfolio", "brochure site",
      "5 page website", "simple website", "company site", "web page",
      "online presence", "google", "seo", "domain", "hosting",
    ],
    title: "Company profile websites",
    cardBlurb:
      "A proper website for your business. Ready in days.",
    priceHint: "From KES 10,000",
    tagline:
      "A website that shows people you're the real deal.",
    intro:
      "When people search for you and find nothing, they call someone else. A simple website fixes that. It's the cheapest thing we build, and usually the quickest to pay for itself.",
    process: [
      {
        title: "We take your content",
        body: "Send us your services, photos and contacts. No write-up? We'll write it after one chat.",
      },
      {
        title: "We build and show you",
        body: "You check it on your phone before it goes live. Two rounds of changes included.",
      },
      {
        title: "We launch and hand over",
        body: "We connect your domain, set up Google and the WhatsApp button. Everything is yours.",
      },
    ],
    packages: [
      {
        name: "3-page",
        price: 10000,
        cadence: "once",
        summary: "Home, About, Contact. Enough for people to trust you and reach you.",
        features: [
          "Three pages, written and designed",
          "Made for phones first — that's where your visitors are",
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
        summary: "Space for your services, your work, and a blog that brings people in from Google.",
        features: [
          "Everything in the 3-page package",
          "Individual pages for your services",
          "Gallery or portfolio section",
          "A blog you can post to, so Google finds you",
          "Enquiry form as well as the WhatsApp button",
          "Google Analytics connected",
        ],
      },
    ],
    packagesNote:
      "Pay once. Domain and hosting are extra, at cost — we don't add anything on top.",
  },

  {
    slug: "ecommerce",
    keywords: [
      "ecommerce", "e-commerce", "online shop", "online store", "shop",
      "sell online", "selling online", "products", "catalogue", "catalog",
      "cart", "checkout", "mpesa", "m-pesa", "payments", "pay online",
      "delivery", "stock", "inventory", "boutique", "supermarket",
    ],
    title: "Ecommerce",
    cardBlurb:
      "Sell online. Customers pay with M-Pesa, you manage orders from one place.",
    priceHint: "From KES 35,000",
    tagline: "An online shop where customers pay with M-Pesa — even while you sleep.",
    intro:
      "Tired of answering 'how much?' in DMs all day? An online shop shows prices, takes M-Pesa payments and records every order — so you know what's selling and what to restock.",
    process: [
      {
        title: "We set up your catalogue",
        body: "Send us your product list — even a spreadsheet works. We upload everything.",
      },
      {
        title: "We wire up payment and delivery",
        body: "Customers pay on their phone with M-Pesa and the order shows up in your dashboard, with delivery set to your areas and rates.",
      },
      {
        title: "We train you on the dashboard",
        body: "We show you how to add products, change prices and manage orders. You won't need us to run your shop.",
      },
    ],
    packages: [
      {
        name: "Basic",
        price: 35000,
        cadence: "once",
        summary: "A simple shop with M-Pesa payments. Great if you're selling through DMs today.",
        features: [
          "Up to 30 products",
          "M-Pesa checkout — customers pay from their phone",
          "WhatsApp enquiry button on every product",
          "Admin dashboard: add and edit products, view orders",
          "One flat delivery rate",
          "Made for phones, set up for Google",
        ],
      },
      {
        name: "Standard",
        price: 60000,
        cadence: "once",
        highlight: true,
        summary: "For shops with lots of products — sizes, colours, delivery zones and regular customers.",
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
        summary: "For when the shop is your main business and you've got stock and staff to manage.",
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
      "Pay once. For M-Pesa you'll need a Paybill or Till in your business name — we'll help you apply.",
  },

  {
    slug: "digital-marketing",
    keywords: [
      "marketing", "digital marketing", "social media", "social media management",
      "instagram", "tiktok", "facebook", "content", "videos", "reels",
      "posters", "posts", "branding", "ads", "meta ads", "advertising",
      "grow followers", "engagement", "funnel", "leads",
    ],
    title: "Digital marketing",
    cardBlurb:
      "We create, post and manage your social media — built to bring you sales, not just likes.",
    priceHint: "From KES 20,000/month",
    tagline:
      "We make the content, post it, manage your pages, and show you the results every month.",
    intro:
      "Posting every day doesn't mean you'll sell. We plan your content to do three jobs: get you noticed, build trust, and turn followers into customers.",
    process: [
      {
        title: "We audit what you already have",
        body: "We look at your pages and your numbers to see what's working and what isn't.",
      },
      {
        title: "We build the funnel",
        body: "A mix of content: some to reach new people, some to build trust, and some that asks for the sale.",
      },
      {
        title: "We produce from scratch",
        body: "We shoot and edit everything ourselves. No stock photos, no copy-paste content.",
      },
      {
        title: "We execute and manage",
        body: "We post on all your pages on time, and reply to comments and DMs so no customer is left waiting.",
      },
      {
        title: "We report every month",
        body: "A simple report: what we posted, who it reached, what it sold, and what we'll do better next month.",
      },
    ],
    packages: [
      {
        name: "5 a week",
        price: 20000,
        cadence: "month",
        summary: "Keeps you showing up for your customers every week.",
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
        summary: "For businesses that want to be the name everyone knows in their space.",
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
      "Paid monthly. No long contract — stop any time.",
    addOns: [
      {
        name: "Meta ads management",
        price: 5000,
        cadence: "month",
        summary: "We set up and run your Facebook and Instagram ads.",
        features: [
          "Campaign setup, targeting and creative",
          "Ongoing optimisation against your goal",
          "Reported alongside your monthly organic numbers",
          "You pay your ad budget straight to Meta — we never hold your money",
        ],
      },
    ],
  },

  {
    slug: "custom-builds",
    keywords: [
      "app", "application", "software", "system", "crm", "erp", "dashboard",
      "automation", "automate", "custom", "booking system", "management system",
      "pos", "point of sale", "integration", "api", "whatsapp bot", "chatbot",
      "ai", "portal", "database",
    ],
    title: "Custom builds",
    cardBlurb:
      "Systems built around how you work — automation, CRMs, client portals and more.",
    priceHint: "Quoted per project",
    tagline:
      "Software made for your business, not the other way round.",
    intro:
      "Some things don't fit a package — a booking system, a CRM, or automation that follows up with customers for you. Tell us what you need and we'll give you a clear quote.",
    process: [
      {
        title: "We map what actually happens",
        body: "We learn how your team really works — WhatsApp groups and spreadsheets included.",
      },
      {
        title: "We scope and quote",
        body: "You get a fixed price and a clear list of what's included before we start.",
      },
      {
        title: "We build in stages",
        body: "You see it working early, so we can adjust as we go.",
      },
    ],
    packages: [
      {
        name: "AI automation",
        price: null,
        summary: "Replies, follow-ups and admin that happen on their own.",
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
        summary: "Your leads, jobs, documents and invoices in one place — plus a login for your clients.",
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
        summary: "Connect WhatsApp and M-Pesa to the systems you already use.",
        features: [
          "Order and status notifications over WhatsApp",
          "M-Pesa Daraja payments and reconciliation",
          "Inbound WhatsApp messages into your CRM",
          "Works with what you already have — no need to start over",
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
