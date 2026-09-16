import Link from "next/link";
import type { Metadata } from "next";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { art } from "@/lib/art";
import { HeroArt } from "@/components/header-band";
import { HeroIllustration } from "@/components/hero-illustration";

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
              <span className="text-accent"> while you run it.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Websites, ecommerce and digital marketing for Kenyan businesses.
              Prices on the page. No forms, no proposals to chase. Just message us.
            </p>

            <div className="mt-9">
              <WhatsAppCta context="Homepage hero" />
              <p className="mt-3.5 text-sm text-muted">
                Opens WhatsApp with your message ready. We usually reply within the hour.
              </p>
            </div>
          </div>

          {/* The drawn illustration is the default. Setting `home` in lib/art.ts
              to a generated file overrides it. */}
          {art.home ? (
            <HeroArt src={art.home} />
          ) : (
            <HeroIllustration className="hidden h-auto w-full lg:block" />
          )}
        </div>
      </section>

      {/* --------------------------- SERVICES --------------------------- */}
      <section className="border-y border-line bg-cream-deep py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            What we build, and what it costs
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
              ["18+", "Kenyan businesses running on systems we built"],
              ["100%", "Built on the same stack we sell — Next.js, Supabase, M-Pesa"],
              ["< 1 hr", "Typical first reply on WhatsApp during working hours"],
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
            Tell us what is slowing your business down.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            One message. We will tell you honestly whether software fixes it —
            and roughly what it costs — before you commit to anything.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context="Homepage footer CTA" />
          </div>
        </div>
      </section>
    </>
  );
}
