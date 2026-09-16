import Link from "next/link";
import type { Metadata } from "next";
import { getAllInvoices, getInvoicePayments } from "@/lib/admin";
import { kes, shortDate, INVOICE_LABEL } from "@/lib/portal";
import { requestMpesaPayment } from "@/app/actions/admin";
import { ActionForm } from "@/components/admin/action-form";

export const metadata: Metadata = { title: "Invoices", robots: { index: false, follow: false } };

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

export default async function AdminInvoicesPage() {
  const invoices = await getAllInvoices();
  const payments = await Promise.all(
    invoices.map(async (i) => [i.id, await getInvoicePayments(i.id)] as const),
  );
  const paymentsById = new Map(payments);

  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "partly_paid")
    .reduce((s, i) => s + (Number(i.amount_kes) - Number(i.paid_kes)), 0);

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Invoices</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Send an M-Pesa prompt straight to the client&rsquo;s handset. Safaricom calls
        back and the invoice reconciles itself.
      </p>

      {outstanding > 0 && (
        <div className="mt-8 rounded-card border border-accent bg-accent-tint px-6 py-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            Outstanding across all clients
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-ink">
            {kes(outstanding)}
          </p>
        </div>
      )}

      {invoices.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
          No invoices yet. Create one from a client record.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-5">
          {invoices.map((inv) => {
            const due = Number(inv.amount_kes) - Number(inv.paid_kes);
            const attempts = paymentsById.get(inv.id) ?? [];
            const settled = inv.status === "paid" || inv.status === "void";

            return (
              <li key={inv.id} className="rounded-card border border-line bg-cream p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-ink">{inv.number}</p>
                      <span className="rounded-full border border-line px-3 py-0.5 font-mono text-[11px] text-muted">
                        {INVOICE_LABEL[inv.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      <Link href={`/admin/clients/${inv.client_id}`} className="hover:text-accent">
                        {inv.clients?.name ?? "Unknown client"}
                      </Link>
                      {inv.description ? ` · ${inv.description}` : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      due {shortDate(inv.due_date)}
                      {Number(inv.paid_kes) > 0 ? ` · ${kes(Number(inv.paid_kes))} received` : ""}
                    </p>
                  </div>
                  <p className="font-mono text-lg font-bold text-accent">{kes(Number(inv.amount_kes))}</p>
                </div>

                {!settled && (
                  <div className="mt-5 border-t border-line pt-5">
                    <ActionForm action={requestMpesaPayment} submitLabel="Send M-Pesa prompt">
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          name="phone"
                          required
                          placeholder="07xx xxx xxx"
                          defaultValue={inv.clients?.name ? "" : ""}
                          className={field}
                        />
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          step="1"
                          required
                          defaultValue={due > 0 ? String(Math.round(due)) : ""}
                          className={field}
                        />
                      </div>
                    </ActionForm>
                  </div>
                )}

                {attempts.length > 0 && (
                  <ul className="mt-5 flex flex-col gap-1 border-t border-line pt-4">
                    {attempts.slice(0, 4).map((p) => (
                      <li key={p.id} className="flex flex-wrap justify-between gap-x-4 font-mono text-xs text-muted">
                        <span>
                          {p.status}
                          {p.mpesa_receipt ? ` · ${p.mpesa_receipt}` : ""}
                          {p.failure_reason ? ` · ${p.failure_reason}` : ""}
                        </span>
                        <span>
                          {kes(Number(p.amount_kes))} · {shortDate(p.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
