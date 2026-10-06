import type { Metadata } from "next";
import Link from "next/link";
import { ShopDemo } from "@/components/demo/shop-demo";
import {
  cleanAccent,
  cleanBusinessName,
  resolveCatalogue,
} from "@/lib/demo/catalogues";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Online shop and POS, working together",
  description:
    "A working demo: sell at the counter, sell on the website, and watch both land in one back office with one stock count.",
  alternates: { canonical: `${site.url}/demos/shop` },
};

type Search = Promise<{ for?: string; type?: string; c?: string }>;

export default async function ShopDemoPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const params = await searchParams;
  const catalogue = resolveCatalogue(params.type);
  const businessName = cleanBusinessName(params.for) ?? catalogue.fallbackName;
  const accent = cleanAccent(params.c);
  const personalised = Boolean(cleanBusinessName(params.for));

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-5 sm:pt-12">
      <Link
        href="/demos"
        className="text-sm font-semibold text-accent underline underline-offset-4"
      >
        &larr; All demos
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
        {personalised ? (
          <>How this would work for {businessName}</>
        ) : (
          <>An online shop and a till that talk to each other</>
        )}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        This is the real thing, not pictures. Sell something at the counter, then buy
        something on the online shop. Both land in the same back office and the same
        stock count drops.
      </p>

      <div className="mt-8">
        <ShopDemo catalogue={catalogue} businessName={businessName} accent={accent} />
      </div>

      <div className="mt-8 rounded-card border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-ink">
          Want this set up for your business?
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Tell us what you sell and where you are. We&rsquo;ll come back to you on
          WhatsApp with what it takes.
        </p>
        <Link
          href="/get-started"
          className="mt-5 inline-flex min-h-[52px] items-center rounded-full bg-accent px-7 text-base font-bold text-cream"
        >
          Start here
        </Link>
      </div>

      <p className="mt-6 text-sm text-muted">
        Everything above is sample stock, invented for the demo. Nothing you tap is
        saved anywhere &mdash; reload the page and it starts fresh.
      </p>
    </div>
  );
}
