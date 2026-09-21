import Link from "next/link";
import type { Metadata } from "next";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { services, priceLabel } from "@/lib/services";
import { art } from "@/lib/art";
import { HeaderBand } from "@/components/header-band";

export const metadata: Metadata = {
  title: "Services and pricing",
  description:
    "Company profile websites from KES 10,000, ecommerce from KES 35,000, and digital marketing from KES 20,000 a month. Clear prices, no proposals to chase.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            What we do, and what it costs.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            All our prices are right here — no need to call just to ask. Pick
            what fits your business.
          </p>

          <HeaderBand src={art.services} priority />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        {services.map((service, i) => (
          <section
            key={service.slug}
            className={`py-14 sm:py-16 ${i > 0 ? "border-t border-line" : ""}`}
          >
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  {service.title}
                </h2>
                <p className="mt-4 max-w-md leading-relaxed text-muted">
                  {service.cardBlurb}
                </p>
                <Link
                  href={`/services/${service.slug}`}
                  className="group mt-6 inline-flex items-center text-sm font-semibold text-accent"
                >
                  See how it works
                  <span
                    aria-hidden="true"
                    className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>

              <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
                {service.packages.map((pkg) => (
                  <li
                    key={pkg.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-cream px-6 py-5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{pkg.name}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">
                        {pkg.summary}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-lg font-bold tracking-tight text-accent">
                      {priceLabel(pkg)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-line bg-cream-deep py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Not sure which one you need?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Tell us what you&rsquo;re trying to fix and we&rsquo;ll point you to the right
            one. If none of them fit, we&rsquo;ll say so.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context="Services page" />
          </div>
        </div>
      </section>
    </>
  );
}
