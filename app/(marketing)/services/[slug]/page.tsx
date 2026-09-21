import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { PackageCard } from "@/components/package-card";
import { services, getService } from "@/lib/services";
import { site } from "@/lib/site";
import { artFor } from "@/lib/art";
import { HeaderBand } from "@/components/header-band";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.tagline,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} | ${site.name}`,
      description: service.tagline,
      url: `${site.url}/services/${service.slug}`,
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const priced = service.packages.filter((p) => p.price !== null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.tagline,
    provider: { "@type": "ProfessionalService", name: site.legalName, url: site.url },
    areaServed: { "@type": "Country", name: "Kenya" },
    ...(priced.length
      ? {
          offers: priced.map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: p.price,
            priceCurrency: "KES",
          })),
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <Link
            href="/services"
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <span aria-hidden="true">←</span> All services
          </Link>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            {service.tagline}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {service.intro}
          </p>

          <div className="mt-9">
            <WhatsAppCta context={service.title} />
          </div>

          <HeaderBand src={artFor(service.slug)} priority />
        </div>
      </section>

      {service.process && (
        <section className="bg-cream-deep py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              How it works
            </h2>

            <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {service.process.map((step, i) => (
                <li key={step.title}>
                  <p className="font-mono text-sm font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {service.packages.some((p) => p.price === null) ? "What we build" : "Packages"}
          </h2>

          <ul
            className={`mt-10 grid gap-5 ${
              service.packages.length >= 3 ? "lg:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            {service.packages.map((pkg) => (
              <li key={pkg.name}>
                <PackageCard pkg={pkg} serviceTitle={service.title} />
              </li>
            ))}
          </ul>

          {service.packagesNote && (
            <p className="mt-7 max-w-2xl text-sm leading-relaxed text-muted">
              {service.packagesNote}
            </p>
          )}

          {service.addOns && (
            <div className="mt-14">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Add-ons
              </h2>
              <ul className="mt-10 grid gap-5 sm:grid-cols-2">
                {service.addOns.map((pkg) => (
                  <li key={pkg.name}>
                    <PackageCard pkg={pkg} serviceTitle={service.title} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-cream-deep py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Send us a message and we&rsquo;ll tell you exactly what this would look
            like for your business. No commitment.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context={`${service.title} — footer`} />
          </div>
        </div>
      </section>
    </>
  );
}
