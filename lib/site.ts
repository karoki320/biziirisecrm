/**
 * The canonical origin, used for canonicals, OG tags, the sitemap and robots.txt.
 *
 * Two bugs lived here, both mine, both caught in production.
 *
 * 1. `??` does not catch an empty string, so a Vercel variable that existed but
 *    was blank produced `new URL("")` and took the build down.
 * 2. The fallback then used VERCEL_URL — which is the *per-deployment* hostname,
 *    unique to every build. Every canonical, OG url and sitemap entry on the
 *    live site pointed at a throwaway `…-84kixal0q-….vercel.app` address.
 *
 * VERCEL_PROJECT_PRODUCTION_URL is the variable that was wanted: Vercel's docs
 * describe it as "a production domain name of the project… always set, even in
 * preview deployments… useful to reliably generate links that point to
 * production." It is stable across deploys and it is never a preview host.
 *
 * Order: explicit setting, then Vercel's production domain, then the known
 * domain. VERCEL_URL is deliberately not in this chain.
 */
const FALLBACK_URL = "https://www.biziirise.com";

function normalise(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\/[^\s/]+/i.test(configured)) {
    return normalise(configured);
  }

  const productionDomain =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionDomain) return normalise(productionDomain);

  return FALLBACK_URL;
}

export const site = {
  name: "Biziirise",
  legalName: "Biziirise Digital Agency",
  tagline: "Websites, ecommerce and digital marketing for Kenyan businesses.",
  url: resolveSiteUrl(),
  locale: "en_KE",
  /** Shown on the site and used as the From address. */
  email: "hello@biziirise.com",
  /**
   * Where mail to us actually needs to land. hello@ is a sending identity on a
   * verified domain, not necessarily a mailbox — never send our own copies to
   * it or they bounce into nothing.
   */
  inbox: "biziirise@gmail.com",
  phone: "+254141025616",
  /** wa.me needs the number with no +, spaces or dashes. */
  whatsappNumber: "254141025616",
  whatsappPrefill: "Hi Biziirise, I'd like to talk about a project",
  socials: {
    tiktok: "https://www.tiktok.com/@biziirise",
    instagram: "https://www.instagram.com/biziirise",
  },
} as const;

/** Primary CTA target. Pass a `context` to attribute which page the tap came from. */
export function whatsappLink(context?: string) {
  const text = context
    ? `${site.whatsappPrefill} (${context})`
    : site.whatsappPrefill;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
