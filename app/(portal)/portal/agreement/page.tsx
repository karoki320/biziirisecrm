import Link from "next/link";
import type { Metadata } from "next";
import { getPortalSession } from "@/lib/portal";
import { getPendingSignatureRequest, requestTitle } from "@/lib/signatures";
import { terms, TERMS_VERSION } from "@/lib/terms";
import { letterhead } from "@/lib/letterhead";
import { site } from "@/lib/site";
import { SignAgreementForm } from "@/components/portal/sign-agreement-form";

export const metadata: Metadata = {
  title: "Sign your agreement",
  robots: { index: false, follow: false },
};

export default async function SignAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [session, request] = await Promise.all([getPortalSession(), getPendingSignatureRequest(id)]);

  if (!request) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Nothing to sign</h1>
        <p className="mt-3 leading-relaxed text-muted">
          You have no agreement waiting for a signature. Signed agreements are in your{" "}
          <Link href="/portal/documents" className="font-semibold text-accent underline underline-offset-4">
            documents
          </Link>
          .
        </p>
      </div>
    );
  }

  const business = session?.clientName ?? "your business";
  const title = requestTitle(request);
  const custom = request.kind === "custom";
  const fileUrl = `/portal/agreement/file?id=${request.id}`;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
        Agreement to sign
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted">
        This is the same agreement you have on paper. Look it over, then sign at the bottom
        with your finger (on a phone) or your mouse.
      </p>

      {custom ? (
        <section className="mt-8">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-between gap-3 rounded-card border border-line bg-cream px-5 py-4 transition-colors hover:border-accent"
          >
            <span className="font-semibold text-ink">📄 Open the agreement</span>
            <span className="text-sm font-semibold text-accent">View PDF →</span>
          </a>
          {/* Desktop and iPhone show the PDF inline; on Android the button above opens it. */}
          <iframe
            src={fileUrl}
            title={title}
            className="mt-4 hidden h-[70vh] w-full rounded-card border border-line bg-white sm:block"
          />
        </section>
      ) : (
        <>
          <dl className="mt-8 overflow-hidden rounded-card border border-line bg-cream">
            {(
              [
                ["Provider", `${letterhead.name}, ${letterhead.addressLines.join(", ")}`],
                ["Client", business],
                ...(request.service ? [["Service", request.service]] : []),
                ...(request.package ? [["Package", request.package]] : []),
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 border-b border-line px-5 py-3 last:border-b-0 sm:flex-row sm:gap-6">
                <dt className="w-28 shrink-0 font-mono text-xs uppercase tracking-wider text-muted sm:pt-0.5">{label}</dt>
                <dd className="text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <section
            aria-label="The terms"
            className="mt-6 max-h-[60vh] overflow-y-auto rounded-card border border-line bg-surface px-5 py-6 sm:px-7"
            tabIndex={0}
          >
            <p className="font-mono text-xs text-muted">Terms version {TERMS_VERSION}</p>
            {terms.map((clause) => (
              <div key={clause.heading} className="mt-5">
                <h2 className="font-bold text-ink">{clause.heading}</h2>
                {clause.body.map((p, i) => (
                  <p key={i} className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
                ))}
              </div>
            ))}
          </section>
        </>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight text-ink">Sign</h2>
        <div className="mt-5">
          <SignAgreementForm
            requestId={request.id}
            defaultName={request.full_name ?? session?.fullName ?? ""}
            business={business}
          />
        </div>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Questions before you sign? Message us on {site.phoneDisplay}.
      </p>
    </div>
  );
}
