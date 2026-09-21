import type { Metadata } from "next";
import Link from "next/link";
import { AgreementForm } from "@/components/agreement-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accept your agreement",
  description:
    "Sign your Biziirise agreement online. No printing, no courier — tick, and the signed PDF lands in your inbox.",
  alternates: { canonical: `${site.url}/agreement` },
  robots: { index: false, follow: true },
};

export default function AgreementPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Sign your agreement online
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        No printing, no courier, no trip into town. Fill this in, tick the box, and
        your signed agreement lands in your inbox. Takes about a minute.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Read the{" "}
        <Link href="/terms" className="font-semibold text-accent underline underline-offset-4">
          full terms
        </Link>{" "}
        first if you haven&rsquo;t yet.
      </p>

      <div className="mt-10">
        <AgreementForm />
      </div>
    </main>
  );
}
