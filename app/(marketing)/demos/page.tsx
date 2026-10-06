import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGUES, CATALOGUE_KEYS } from "@/lib/demo/catalogues";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Demos you can actually use",
  description:
    "Working demos of the Biziirise systems: an online shop and POS till that share one stock count and one back office.",
  alternates: { canonical: `${site.url}/demos` },
};

const TYPE_LABELS: Record<string, string> = {
  minimart: "Minimart",
  pharmacy: "Chemist",
  hardware: "Hardware",
  boutique: "Boutique",
  restaurant: "Restaurant",
  salon: "Salon",
};

export default function DemosPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-10 sm:pt-14">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
        See it working before you buy it
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        These are not screenshots. Tap through them the way your customers and your
        counter staff would.
      </p>

      <article className="mt-10 rounded-card border border-line bg-surface p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">
          Website + POS
        </p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight text-ink">
          Online shop and till, one system
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          A customer orders on your website and pays by M-Pesa. Someone else buys the
          same thing at your counter. Both sales land in one back office and both take
          from one stock count &mdash; so you never sell what you no longer have.
        </p>

        <Link
          href="/demos/shop"
          className="mt-6 inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-base font-bold text-cream"
        >
          Open the demo
        </Link>

        <div className="mt-7 border-t border-line pt-5">
          <p className="text-sm font-semibold text-ink">Or see it as your kind of business</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CATALOGUE_KEYS.map((key) => (
              <li key={key}>
                <Link
                  href={`/demos/shop?type=${key}`}
                  className="inline-flex min-h-[44px] items-center rounded-full border-2 border-line bg-cream px-4 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {TYPE_LABELS[key] ?? CATALOGUES[key].fallbackName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <div className="mt-10 rounded-card border border-dashed border-line p-5 text-center sm:p-7">
        <p className="text-base font-semibold text-ink">
          Need a demo for something else?
        </p>
        <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-muted">
          Booking systems, delivery tracking, rent collection, client portals &mdash;
          we build them too. Tell us what you&rsquo;re trying to run.
        </p>
        <Link
          href="/get-started"
          className="mt-5 inline-flex min-h-[52px] items-center rounded-full border-2 border-accent px-7 text-base font-bold text-accent"
        >
          Tell us what you need
        </Link>
      </div>
    </div>
  );
}
