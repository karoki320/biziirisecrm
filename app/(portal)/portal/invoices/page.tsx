import type { Metadata } from "next";
import { getInvoices, kes, shortDate, INVOICE_LABEL } from "@/lib/portal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

const TONE: Record<string, string> = {
  paid: "border-transparent bg-accent-tint text-accent",
  sent: "border-line bg-cream-deep text-ink",
  partly_paid: "border-line bg-cream-deep text-ink",
  draft: "border-line bg-cream text-muted",
  void: "border-line bg-cream text-muted",
};

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "partly_paid")
    .reduce((sum, i) => sum + (i.amount_kes - i.paid_kes), 0);

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Invoices
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        What has been billed, what has been paid, and what is still outstanding.
      </p>

      {outstanding > 0 && (
        <div className="mt-8 rounded-card border border-accent bg-accent-tint px-6 py-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            Outstanding
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-ink">
            {kes(outstanding)}
          </p>
        </div>
      )}

      <section className="mt-10">
        {invoices.length === 0 ? (
          <p className="rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
            No invoices yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="bg-cream px-6 py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-ink">{inv.number}</p>
                      <span
                        className={`rounded-full border px-3 py-0.5 font-mono text-[11px] font-medium ${TONE[inv.status] ?? TONE.draft}`}
                      >
                        {INVOICE_LABEL[inv.status]}
                      </span>
                    </div>
                    {inv.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {inv.description}
                      </p>
                    )}
                    <p className="mt-1.5 font-mono text-xs text-muted">
                      {inv.status === "paid"
                        ? `Paid ${shortDate(inv.paid_at)}`
                        : `Due ${shortDate(inv.due_date)}`}
                      {inv.paid_kes > 0 && inv.status !== "paid"
                        ? ` · ${kes(inv.paid_kes)} received`
                        : ""}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-bold text-accent">
                    {kes(inv.amount_kes)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm leading-relaxed text-muted">
        Paying by M-Pesa from this page arrives in Phase 3. For now, message us
        on {site.phone} and we will send you the Paybill details.
      </p>
    </>
  );
}
