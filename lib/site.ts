const FALLBACK_URL = "https://biziirise.com";

/**
 * The site's absolute origin.
 *
 * `??` was not enough here. A Vercel environment variable that exists but is
 * blank is an empty string, not undefined, so the fallback never fired and
 * `new URL("")` threw during page-data collection — taking the whole build
 * down with a message that pointed at app/layout.tsx rather than at the cause.
 *
 * This accepts only something that actually looks like an origin, falls back to
 * the Vercel-provided host so preview deployments work, and strips any trailing
 * slash so `${site.url}/blog` never becomes a double slash.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\/[^\s]+$/i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  const vercelHost = (
    process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL
  )?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
  }

  return FALLBACK_URL;
}

export const site = {
  name: "Biziirise",
  legalName: "Biziirise Digital Agency",
  tagline: "Websites, ecommerce and digital marketing for Kenyan businesses.",
  url: resolveSiteUrl(),
  locale: "en_KE",
  email: "karokieugene000@gmail.com",
  phone: "+254117232766",
  /** wa.me needs the number with no +, spaces or dashes. */
  whatsappNumber: "254117232766",
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
