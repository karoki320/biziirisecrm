/**
 * The things we sell, as proposal building blocks.
 *
 * Each package carries its own price, its own scope and its own exclusions,
 * so picking two packages on the form produces a complete, correct document
 * without anyone retyping the scope. Prices live here and nowhere else —
 * when they change, every future proposal changes with them.
 *
 * No "server-only" here on purpose: the picker in the browser needs these.
 */

export type ScopeSection = { heading: string; points: string[] };

export type ProposalPackage = {
  key: string;
  /** What appears on the investment table. */
  label: string;
  /** The small grey line under it. */
  detail: string;
  /** KES. */
  amount: number;
  /** A retainer is quoted per month and never added into the project total. */
  recurring?: "month";
  /** Shown in the picker to group things sensibly. */
  group: "Build" | "Hardware" | "Marketing";
  /** Suggested build time; the longest selected package wins. */
  weeks: number;
  includes: ScopeSection[];
  excludes: string[];
};

const M_PESA_EXCLUSION =
  "Your Safaricom Paybill or Till, and the Daraja API credentials that go with it. You will need these in your business name before M-Pesa can go live; we will guide you through the application";
const PHOTO_EXCLUSION =
  "Product photography and written product descriptions — you supply these, or we quote for them";
const CHARGES_EXCLUSION = "Safaricom's own M-Pesa transaction charges";
const ADS_EXCLUSION = "Advertising spend on Meta or Google";

export const PACKAGES: ProposalPackage[] = [
  {
    key: "ecom_pos",
    label: "E-commerce website with integrated point of sale",
    detail: "Build, setup, testing and training",
    amount: 70000,
    group: "Build",
    weeks: 3,
    includes: [
      {
        heading: "The online shop",
        points: [
          "Product catalogue with categories, sizes, colours and multiple photos per item",
          "Search, filters and a shopping cart that survives a closed browser",
          "M-Pesa checkout (STK push straight to the customer's phone) and card payment",
          "Delivery options with charges by area, plus in-shop collection",
          "Order confirmation to the customer by email and WhatsApp",
          "Mobile-first design in your brand's colours and type",
          "Pages search engines can read, so you can be found for what you sell",
          "Your own domain, secured with HTTPS",
        ],
      },
      {
        heading: "Admin dashboard",
        points: [
          "Add, edit and retire products; set prices and stock levels",
          "Every order in one list, with its status from paid to delivered",
          "Customer list with what each has bought",
          "Daily, weekly and monthly sales, split between shop and website",
          "Low-stock and out-of-stock alerts",
          "Separate logins for you and for staff, with staff kept out of the money pages",
        ],
      },
      {
        heading: "Point of sale",
        points: [
          "Tap-to-sell screen built for a tablet, usable by someone who has never seen it before",
          "Barcode scanning to add an item to the sale",
          "Cash and M-Pesa payment, with change calculated",
          "Printed receipt at the counter",
          "Sales recorded against the same stock and the same reports as the website",
          "Keeps working through a short internet outage and catches up when it returns",
        ],
      },
    ],
    excludes: [
      PHOTO_EXCLUSION,
      M_PESA_EXCLUSION,
      CHARGES_EXCLUSION,
      ADS_EXCLUSION,
      "KRA eTIMS invoicing, if your accountant requires it",
      "Stock counting and data entry of your existing inventory beyond the first 150 items",
    ],
  },
  {
    key: "hardware_pos",
    label: "Hardware package",
    detail: "Tablet, thermal receipt printer, barcode scanner",
    amount: 30000,
    group: "Hardware",
    weeks: 1,
    includes: [
      {
        heading: "Hardware",
        points: [
          "Android tablet, 10 inch — the counter screen your staff sell from",
          "Thermal receipt printer — prints at the counter, no ink to buy",
          "Barcode scanner — adds an item to the sale by scanning its tag",
          "Delivered, connected and tested in your shop, with your staff shown how to use it",
        ],
      },
    ],
    excludes: [
      "Replacement of hardware damaged, lost or stolen after handover",
    ],
  },
  {
    key: "ecom_basic",
    label: "Online shop — Basic",
    detail: "Catalogue, cart and M-Pesa checkout",
    amount: 35000,
    group: "Build",
    weeks: 2,
    includes: [
      {
        heading: "The online shop",
        points: [
          "Up to 50 products with photos, prices and stock",
          "Shopping cart and M-Pesa checkout",
          "Order list and order status in an admin dashboard",
          "Mobile-first design, your own domain, secured with HTTPS",
        ],
      },
    ],
    excludes: [PHOTO_EXCLUSION, M_PESA_EXCLUSION, CHARGES_EXCLUSION],
  },
  {
    key: "ecom_standard",
    label: "Online shop — Standard",
    detail: "Larger catalogue, delivery zones, customer accounts",
    amount: 60000,
    group: "Build",
    weeks: 3,
    includes: [
      {
        heading: "The online shop",
        points: [
          "Unlimited products with categories, variants and multiple photos",
          "Shopping cart, customer accounts and order history",
          "M-Pesa and card checkout, with delivery charges by area",
          "Admin dashboard with sales reports and low-stock alerts",
          "Mobile-first design, your own domain, secured with HTTPS",
        ],
      },
    ],
    excludes: [PHOTO_EXCLUSION, M_PESA_EXCLUSION, CHARGES_EXCLUSION, ADS_EXCLUSION],
  },
  {
    key: "ecom_premium",
    label: "Online shop — Premium",
    detail: "Full build with automation and integrations",
    amount: 120000,
    group: "Build",
    weeks: 5,
    includes: [
      {
        heading: "The online shop",
        points: [
          "Everything in Standard",
          "WhatsApp ordering and automated order updates",
          "Abandoned-cart and repeat-customer follow-up",
          "Discount codes, bundles and seasonal campaigns",
          "Reporting on what sells, when, and to whom",
        ],
      },
    ],
    excludes: [PHOTO_EXCLUSION, M_PESA_EXCLUSION, CHARGES_EXCLUSION, ADS_EXCLUSION],
  },
  {
    key: "profile_3",
    label: "Company profile website — 3 pages",
    detail: "Home, about, contact",
    amount: 10000,
    group: "Build",
    weeks: 1,
    includes: [
      {
        heading: "The website",
        points: [
          "Three pages written and designed around what you do",
          "WhatsApp and call buttons on every page",
          "Mobile-first design, your own domain, secured with HTTPS",
          "Set up on Google so people searching your name find you",
        ],
      },
    ],
    excludes: ["Photography and copywriting beyond what you supply"],
  },
  {
    key: "profile_6",
    label: "Company profile website — 6 pages",
    detail: "Home, about, services, work, blog, contact",
    amount: 20000,
    group: "Build",
    weeks: 2,
    includes: [
      {
        heading: "The website",
        points: [
          "Six pages written and designed around what you do",
          "An enquiry form that reaches you by email and WhatsApp",
          "A blog or news section you can post to yourself",
          "Mobile-first design, your own domain, secured with HTTPS",
          "Set up on Google so people searching your name find you",
        ],
      },
    ],
    excludes: ["Photography and copywriting beyond what you supply"],
  },
  {
    key: "marketing_20",
    label: "Digital marketing retainer — 5 videos a week",
    detail: "Plus 2 static posts, all platforms, monthly report",
    amount: 20000,
    recurring: "month",
    group: "Marketing",
    weeks: 1,
    includes: [
      {
        heading: "Digital marketing",
        points: [
          "An audit of the platforms you are already on and what is and is not working",
          "A content plan built as a funnel: awareness, educational, then direct sales",
          "Five videos a week and two static posts, produced from scratch",
          "Posted and managed across your platforms",
          "A written report every month",
        ],
      },
    ],
    excludes: [ADS_EXCLUSION],
  },
  {
    key: "marketing_35",
    label: "Digital marketing retainer — 8 videos a week",
    detail: "Plus static posts, all platforms, monthly report",
    amount: 35000,
    recurring: "month",
    group: "Marketing",
    weeks: 1,
    includes: [
      {
        heading: "Digital marketing",
        points: [
          "An audit of the platforms you are already on and what is and is not working",
          "A content plan built as a funnel: awareness, educational, then direct sales",
          "Eight videos a week plus static posts, produced from scratch",
          "Posted and managed across your platforms",
          "A written report every month",
        ],
      },
    ],
    excludes: [ADS_EXCLUSION],
  },
  {
    key: "meta_ads",
    label: "Meta ads management",
    detail: "Campaign setup and management; ad budget paid by you",
    amount: 5000,
    recurring: "month",
    group: "Marketing",
    weeks: 1,
    includes: [
      {
        heading: "Meta ads",
        points: [
          "Campaign, audience and creative set up on Facebook and Instagram",
          "Monitored and adjusted while it runs",
          "Reporting on what each shilling brought back",
        ],
      },
    ],
    excludes: [
      "The advertising budget itself, which you pay to Meta directly and which never passes through us",
    ],
  },
];

export function findPackage(key: string): ProposalPackage | undefined {
  return PACKAGES.find((p) => p.key === key);
}

export const PAYMENT_TERMS = {
  "50_50": {
    label: "50% deposit, 50% on handover",
    rows: [
      ["50%", "on acceptance", "Starts the work and covers materials"],
      ["50%", "on handover", "Due once the system is live and your staff are trained"],
    ] as const,
  },
  "60_40": {
    label: "60% deposit, 40% on handover",
    rows: [
      ["60%", "on acceptance", "Starts the work and covers hardware"],
      ["40%", "on handover", "Due once the system is live and your staff are trained"],
    ] as const,
  },
  "50_30_20": {
    label: "50% deposit, 30% at demo, 20% on handover",
    rows: [
      ["50%", "on acceptance", "Starts the work and covers materials"],
      ["30%", "at demo", "Due when you have seen it working"],
      ["20%", "on handover", "Due once it is live and your staff are trained"],
    ] as const,
  },
} as const;

export type PaymentTermKey = keyof typeof PAYMENT_TERMS;

/** The /get-started business types, mapped onto a demo catalogue. */
export function demoTypeFor(businessType?: string | null): string | null {
  const t = (businessType ?? "").toLowerCase();
  if (!t) return null;
  if (t.includes("pharmacy") || t.includes("chemist")) return "pharmacy";
  if (t.includes("hardware")) return "hardware";
  if (t.includes("boutique")) return "boutique";
  if (t.includes("restaurant") || t.includes("caf")) return "restaurant";
  if (t.includes("salon") || t.includes("barber")) return "salon";
  if (t.includes("minimart") || t.includes("supermarket") || t.includes("shop")) {
    return "minimart";
  }
  return null;
}

export const KES_FMT = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
