/**
 * Sample stock for the live demo at /demos/shop.
 *
 * Why several catalogues rather than one: the demo is walked into a real
 * shop and shown to the person who owns it. A pharmacist looking at a list
 * of unga and sugar is looking at someone else's business. A chemist seeing
 * her own shelf in the first two seconds is looking at hers.
 *
 * Prices are ordinary Nairobi retail in KES, rounded the way a shop rounds.
 * None of this is real client data and no catalogue is any real business.
 */

export type DemoProduct = {
  id: string;
  name: string;
  /** KES. Whole shillings — nobody prices in cents here. */
  price: number;
  stock: number;
  category: string;
};

export type Catalogue = {
  key: CatalogueKey;
  /** What the demo calls the business in headings when no name is given. */
  fallbackName: string;
  /** "Products" for a shop, "Menu" for a kitchen, "Services" for a salon. */
  itemsWord: string;
  /** What the till button says. */
  sellWord: string;
  /** A salon does not count stock; a minimart lives or dies by it. */
  tracksStock: boolean;
  products: DemoProduct[];
};

export const CATALOGUE_KEYS = [
  "minimart",
  "pharmacy",
  "hardware",
  "boutique",
  "restaurant",
  "salon",
] as const;

export type CatalogueKey = (typeof CATALOGUE_KEYS)[number];

/** The business types on /get-started, mapped onto a catalogue. */
const TYPE_ALIASES: Record<string, CatalogueKey> = {
  shop: "minimart",
  "minimart/supermarket": "minimart",
  minimart: "minimart",
  supermarket: "minimart",
  pharmacy: "pharmacy",
  chemist: "pharmacy",
  boutique: "boutique",
  hardware: "hardware",
  "restaurant/café": "restaurant",
  "restaurant/cafe": "restaurant",
  restaurant: "restaurant",
  cafe: "restaurant",
  hotel: "restaurant",
  "salon/barber": "salon",
  salon: "salon",
  barber: "salon",
  other: "minimart",
};

function p(
  id: string,
  name: string,
  price: number,
  stock: number,
  category: string,
): DemoProduct {
  return { id, name, price, stock, category };
}

export const CATALOGUES: Record<CatalogueKey, Catalogue> = {
  minimart: {
    key: "minimart",
    fallbackName: "Your Minimart",
    itemsWord: "Products",
    sellWord: "Sell",
    tracksStock: true,
    products: [
      p("m1", "Maize flour 2kg", 190, 34, "Dry goods"),
      p("m2", "Sugar 1kg", 180, 41, "Dry goods"),
      p("m3", "Cooking oil 1L", 310, 18, "Dry goods"),
      p("m4", "Rice 2kg", 350, 22, "Dry goods"),
      p("m5", "Fresh milk 500ml", 60, 7, "Fridge"),
      p("m6", "Bread 400g", 75, 12, "Bakery"),
      p("m7", "Eggs, tray of 30", 420, 9, "Fridge"),
      p("m8", "Tea leaves 250g", 190, 26, "Dry goods"),
      p("m9", "Bar soap", 85, 55, "Household"),
      p("m10", "Washing powder 500g", 180, 31, "Household"),
      p("m11", "Table salt 1kg", 45, 48, "Dry goods"),
      p("m12", "Soda 500ml", 70, 5, "Fridge"),
    ],
  },

  pharmacy: {
    key: "pharmacy",
    fallbackName: "Your Chemist",
    itemsWord: "Products",
    sellWord: "Sell",
    tracksStock: true,
    products: [
      p("ph1", "Paracetamol, 20 tabs", 150, 44, "Over the counter"),
      p("ph2", "Cough syrup 100ml", 350, 16, "Over the counter"),
      p("ph3", "Vitamin C, 20 tabs", 320, 28, "Supplements"),
      p("ph4", "Antiseptic 100ml", 240, 19, "First aid"),
      p("ph5", "Surgical spirit 100ml", 90, 33, "First aid"),
      p("ph6", "Bandage roll", 120, 6, "First aid"),
      p("ph7", "Plasters, 10 pack", 110, 40, "First aid"),
      p("ph8", "Face masks, 10 pack", 150, 23, "Protective"),
      p("ph9", "Examination gloves, 10 pairs", 200, 14, "Protective"),
      p("ph10", "Hand sanitiser 250ml", 280, 21, "Protective"),
      p("ph11", "Digital thermometer", 850, 4, "Devices"),
      p("ph12", "Blood pressure monitor", 4500, 2, "Devices"),
    ],
  },

  hardware: {
    key: "hardware",
    fallbackName: "Your Hardware",
    itemsWord: "Products",
    sellWord: "Sell",
    tracksStock: true,
    products: [
      p("h1", "Cement 50kg", 820, 60, "Building"),
      p("h2", "Nails 1kg", 180, 44, "Building"),
      p("h3", "Wire mesh roll", 2900, 7, "Building"),
      p("h4", "PVC pipe 3m", 480, 25, "Plumbing"),
      p("h5", "Paint 4L", 1850, 11, "Finishes"),
      p("h6", "Hammer", 650, 15, "Tools"),
      p("h7", "Screwdriver set", 890, 9, "Tools"),
      p("h8", "Tape measure 5m", 350, 18, "Tools"),
      p("h9", "Spade", 750, 12, "Tools"),
      p("h10", "Wheelbarrow", 4200, 3, "Tools"),
      p("h11", "Padlock", 450, 27, "Security"),
      p("h12", "Hinges, pair", 220, 38, "Fittings"),
    ],
  },

  boutique: {
    key: "boutique",
    fallbackName: "Your Boutique",
    itemsWord: "Products",
    sellWord: "Sell",
    tracksStock: true,
    products: [
      p("b1", "Dress", 2500, 8, "Women"),
      p("b2", "Jeans", 1800, 14, "Unisex"),
      p("b3", "T-shirt", 900, 30, "Unisex"),
      p("b4", "Jacket", 3200, 6, "Unisex"),
      p("b5", "Sneakers", 3500, 5, "Shoes"),
      p("b6", "Sandals", 1400, 11, "Shoes"),
      p("b7", "Handbag", 2200, 7, "Bags"),
      p("b8", "Belt", 750, 19, "Accessories"),
      p("b9", "Scarf", 650, 16, "Accessories"),
      p("b10", "Cap", 600, 22, "Accessories"),
      p("b11", "Socks, 3 pack", 350, 35, "Accessories"),
      p("b12", "Earrings", 450, 24, "Accessories"),
    ],
  },

  restaurant: {
    key: "restaurant",
    fallbackName: "Your Restaurant",
    itemsWord: "Menu",
    sellWord: "Order",
    tracksStock: true,
    products: [
      p("r1", "Pilau, plate", 350, 26, "Mains"),
      p("r2", "Ugali and sukuma", 180, 40, "Mains"),
      p("r3", "Rice and beans", 200, 35, "Mains"),
      p("r4", "Chicken stew", 420, 18, "Mains"),
      p("r5", "Nyama choma, quarter kilo", 450, 14, "Grill"),
      p("r6", "Chips", 200, 50, "Sides"),
      p("r7", "Chapati", 30, 80, "Sides"),
      p("r8", "Samosa", 50, 45, "Snacks"),
      p("r9", "Mandazi", 25, 60, "Snacks"),
      p("r10", "Fresh juice", 150, 22, "Drinks"),
      p("r11", "Soda 300ml", 70, 48, "Drinks"),
      p("r12", "Tea", 50, 70, "Drinks"),
    ],
  },

  salon: {
    key: "salon",
    fallbackName: "Your Salon",
    itemsWord: "Services",
    sellWord: "Book",
    tracksStock: false,
    products: [
      p("s1", "Haircut", 300, 0, "Hair"),
      p("s2", "Kids cut", 200, 0, "Hair"),
      p("s3", "Shave", 150, 0, "Hair"),
      p("s4", "Beard trim", 200, 0, "Hair"),
      p("s5", "Braiding", 1500, 0, "Styling"),
      p("s6", "Wig install", 2500, 0, "Styling"),
      p("s7", "Wash and blow dry", 800, 0, "Styling"),
      p("s8", "Relaxer", 900, 0, "Treatments"),
      p("s9", "Dye", 1200, 0, "Treatments"),
      p("s10", "Deep treatment", 1000, 0, "Treatments"),
      p("s11", "Manicure", 600, 0, "Nails"),
      p("s12", "Pedicure", 800, 0, "Nails"),
    ],
  },
};

/** Accepts a catalogue key, a /get-started business type, or anything else. */
export function resolveCatalogue(raw?: string | null): Catalogue {
  const key = (raw ?? "").trim().toLowerCase();
  if ((CATALOGUE_KEYS as readonly string[]).includes(key)) {
    return CATALOGUES[key as CatalogueKey];
  }
  const aliased = TYPE_ALIASES[key];
  return CATALOGUES[aliased ?? "minimart"];
}

/**
 * The business name shown throughout the demo.
 *
 * Whatever arrives here came off a URL that Eugene generated, so it is
 * treated as hostile text: stripped to plain characters and capped, so a
 * forwarded link cannot turn the page into a billboard for someone else.
 */
export function cleanBusinessName(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[^\p{L}\p{N}\s'&.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned.length > 1 ? cleaned : null;
}

/** Six hex digits or nothing. Never interpolated unvalidated into CSS. */
export function cleanAccent(raw?: string | null): string | null {
  const v = (raw ?? "").trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export const KES = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});
