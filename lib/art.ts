/**
 * Header art registry — the one place art gets switched on.
 *
 * Every value starts null, and a null renders no band at all rather than an
 * empty box or a broken image. Drop a file into `public/art/` and set its path
 * here; nothing else needs touching. Prompts and specs: docs/IMAGE-PROMPTS.md
 *
 * Keys for service pages match their slugs in `lib/services.ts`.
 */

export type ArtKey =
  | "home"
  | "services"
  | "websites"
  | "ecommerce"
  | "digital-marketing"
  | "custom-builds"
  | "work"
  | "blog";

export const art: Record<ArtKey, string | null> = {
  // Square, 1200 × 1200 — sits right of the homepage headline.
  home: null, //            "/art/hero.webp"

  // Bands, 1920 × 600 (16:5) — sit under each page's header text.
  services: null, //        "/art/band-services.webp"
  websites: null, //        "/art/band-websites.webp"
  ecommerce: null, //       "/art/band-ecommerce.webp"
  "digital-marketing": null, // "/art/band-marketing.webp"
  "custom-builds": null, // "/art/band-custom.webp"
  work: null, //            "/art/band-work.webp"
  blog: null, //            "/art/band-blog.webp"
};

/** Safe lookup for dynamic keys (service slugs). Unknown key → no art. */
export function artFor(key: string): string | null {
  return (art as Record<string, string | null>)[key] ?? null;
}
