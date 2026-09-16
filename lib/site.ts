export const site = {
  name: "Biziirise",
  legalName: "Biziirise Digital Agency",
  tagline: "Websites, ecommerce and digital marketing for Kenyan businesses.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://biziirise.com",
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
