import Link from "next/link";
import type { Metadata } from "next";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { ServiceFinder } from "@/components/service-finder";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { BiziiriseHeroVisual } from "@/components/hero/biziirise-hero-visual";

export const metadata: Metadata = {
  title: `${site.legalName} — ${site.tagline}`,
  alternates: { canonical: "/" },
};


export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.legalName,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    areaServed: { "@type": "Country", name: "Kenya" },
    address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" },
    sameAs: [site.socials.instagram, site.socials.tiktok],
    description: site.tagline,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------------------------------------------------------------
          HERO — minimal above the fold. One headline, one subheadline,
          one CTA. The art slot below is intentionally empty until the
          image direction is signed off (see docs/IMAGE-PROMPTS.md).
          --------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28">
          <div>
            <p className="mb-5 inline-flex items-center rounded-full bg-accent-tint px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              Nairobi · 18+ businesses running on our builds
            </p>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Software that runs your business
              <span className="text-accent"> with you.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Websites, online shops and social media marketing for Kenyan
              businesses. See the prices, pick what you need, get a quote.
            </p>

            {/* Two doors, on purpose. The finder is for someone who does not
                yet know what to call the thing they need — it asks in their
                words, then hands them to WhatsApp already introduced. The raw
                CTA stays for someone who just wants to talk. */}
            <div className="mt-9 space-y-4">
              <ServiceFinder />

              <div>
                <WhatsAppCta context="Homepage hero" />
                <p className="mt-3.5 text-sm text-muted">
                  Rather just talk? Message us — we usually reply within the hour.
                </p>
              </div>
            </div>
          </div>

          {/* The product, not a picture about the product. Isolated in its own
              component; on small screens it stacks under the CTA. */}
          <BiziiriseHeroVisual className="lg:-mr-6" />
        </div>
      </section>

      {/* --------------------------- SERVICES --------------------------- */}
      <section className="border-y border-line bg-cream-deep py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What we do, and what it costs
          </h2>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col rounded-card border border-line bg-cream p-7 transition-colors hover:border-accent"
                >
                  <h3 className="text-xl font-bold text-ink">{service.title}</h3>
                  <p className="mt-2 font-mono text-sm font-semibold text-accent">
                    {service.priceHint}
                  </p>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">
                    {service.cardBlurb}
                  </p>
                  <span className="mt-5 text-sm font-semibold text-accent">
                    See how it works
                    <span aria-hidden="true" className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------- SOCIAL PROOF ------------------------- */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <dl className="grid gap-10 sm:grid-cols-3">
            {[
              ["18+", "Kenyan businesses using what we built"],
              ["100%", "Built with the same tools we use for our clients"],
              ["< 1 hr", "Usual reply time on WhatsApp during working hours"],
            ].map(([stat, label]) => (
              <div key={label}>
                <dt className="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl">
                  {stat}
                </dt>
                <dd className="mt-3 leading-relaxed text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------- SECOND CTA -------------------------- */}
      <section className="border-t border-line bg-cream-deep py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What&rsquo;s slowing your business down?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Send us one message. We&rsquo;ll tell you straight if we can help, and
            roughly what it&rsquo;ll cost — no strings attached.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context="Homepage footer CTA" />
          </div>
        </div>
      </section>
    </>
  );
}
