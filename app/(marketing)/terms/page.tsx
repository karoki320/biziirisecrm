import type { Metadata } from "next";
import Link from "next/link";
import { terms, TERMS_VERSION } from "@/lib/terms";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of engagement",
  description:
    "How Biziirise works with clients — scope, money, revisions, ownership and support. Plain language, no small print.",
  alternates: { canonical: `${site.url}/terms` },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Version {TERMS_VERSION}
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Terms of engagement
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        What you can expect from us, and what we need from you. Plain English,
        no hidden small print.
      </p>

      <div className="mt-10 space-y-9">
        {terms.map((clause) => (
          <section key={clause.heading}>
            <h2 className="text-lg font-bold tracking-tight text-ink">{clause.heading}</h2>
            <div className="mt-2.5 space-y-3">
              {clause.body.map((p) => (
                <p key={p} className="leading-relaxed text-muted">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border-2 border-accent bg-accent-tint px-6 py-7">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">
          Sign online in a minute
        </h2>
        <p className="mt-2.5 leading-relaxed text-muted">
          Tick a box and your signed agreement comes straight to your inbox as a PDF.
          It counts just like signing on paper.
        </p>
        <Link
          href="/agreement"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-accent px-7 py-3.5
                     font-semibold text-white transition-colors hover:bg-accent-hover sm:w-auto"
        >
          Accept the terms
        </Link>
      </div>

      <p className="mt-10 text-sm leading-relaxed text-muted">
        Not sure about something? Message us before you agree &mdash; we&rsquo;re happy
        to explain.
      </p>
    </main>
  );
}
