import type { Metadata } from "next";
import { GetStartedForm } from "@/components/get-started-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Set up your business system",
  description:
    "Tell us about your business and we'll get back to you on WhatsApp. Websites, POS, tablets and receipt printers for Kenyan businesses.",
  alternates: { canonical: `${site.url}/get-started` },
};

export default function GetStartedPage() {
  return (
    <main className="mx-auto max-w-lg px-5 pb-16 pt-10 sm:pt-14">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
        Let&rsquo;s set up your business system
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Tell us a bit about your business and we&rsquo;ll get back to you on WhatsApp.
      </p>

      <div className="mt-9">
        <GetStartedForm />
      </div>
    </main>
  );
}
