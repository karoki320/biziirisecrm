import type { Metadata } from "next";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { published } from "@/lib/work";
import { site } from "@/lib/site";
import { art } from "@/lib/art";
import { HeaderBand } from "@/components/header-band";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Restaurants, law firms, retailers and ministries running on systems Biziirise built — M-Pesa checkout, WhatsApp ordering, and sites that hold up under the hood.",
  alternates: { canonical: "/work" },
};

const sectors = [...new Set(published.map((c) => c.sector))];

/** A bad URL in the data should show an ugly label, not fail the build. */
function prettyHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }
}

export default function WorkPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Biziirise client work",
    itemListElement: published
      .filter((c) => c.url)
      .map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.client,
        url: c.url,
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Businesses running on what we built.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Every one of these is live right now, taking real orders, real
            enquiries and real payments. Click through and use them — that is the
            only review that counts.
          </p>

          <HeaderBand src={art.work} priority />

          <dl className="mt-12 grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-3xl font-extrabold tracking-tight text-accent">
                {published.length}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Case studies below
              </dd>
            </div>
            <div>
              <dt className="font-mono text-3xl font-extrabold tracking-tight text-accent">
                {sectors.length}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Sectors: {sectors.join(", ").toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-3xl font-extrabold tracking-tight text-accent">
                18+
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Kenyan businesses we have built for in total
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <ul className="mx-auto flex max-w-6xl flex-col gap-5 px-5">
          {published.map((c) => (
            <li
              key={c.slug}
              className="rounded-card border border-line bg-cream-deep p-7 sm:p-9"
            >
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                      {c.sector}
                    </span>
                    <span aria-hidden="true" className="text-line">|</span>
                    <span className="text-xs text-muted">{c.location}</span>
                  </div>

                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
                    {c.client}
                  </h2>

                  <p className="mt-4 max-w-xl leading-relaxed text-muted">
                    {c.summary}
                  </p>

                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-6 inline-flex items-center text-sm font-semibold text-accent"
                    >
                      Visit {prettyHost(c.url)}
                      <span
                        aria-hidden="true"
                        className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
                      >
                        ↗
                      </span>
                    </a>
                  ) : (
                    <p className="mt-6 text-sm text-muted">
                      Not currently live at a public address.
                    </p>
                  )}
                </div>

                <div className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                    What we built
                  </h3>
                  <ul className="mt-4 flex flex-col gap-2">
                    {c.scope.map((s) => (
                      <li
                        key={s}
                        className="flex gap-2.5 text-[15px] leading-relaxed text-ink"
                      >
                        <span aria-hidden="true" className="text-accent">—</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {c.stack.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-line bg-cream px-3 py-1 font-mono text-[11px] text-muted"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Yours could be the next one on this page.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Tell us what your business needs to do that it cannot do today.
            We will tell you honestly whether we are the right people to build it.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context="Work page" />
          </div>
          <p className="mt-8 text-sm text-muted">
            Prefer to talk? {site.phone}
          </p>
        </div>
      </section>
    </>
  );
}
