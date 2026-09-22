import Link from "next/link";
import type { Metadata } from "next";
import { getClients } from "@/lib/admin";
import { createClientRecord } from "@/app/actions/clients";
import { ActionForm } from "@/components/admin/action-form";
import { shortDate } from "@/lib/portal";

export const metadata: Metadata = { title: "Clients", robots: { index: false, follow: false } };

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Clients</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Every business you work for. Add one here, or convert a won lead from the
        pipeline — either way you never need to open Supabase.
      </p>

      <div className="mt-8 rounded-card border border-line bg-cream-deep p-6">
        <h2 className="font-bold text-ink">Add a client</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          A name is the only thing required. You can invite them to the portal and
          fill in the rest from their record.
        </p>
        <ActionForm action={createClientRecord} submitLabel="Add client" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Client name" className={field} />
            <input name="company" placeholder="Business name (optional)" className={field} />
            <input name="email" type="email" placeholder="Email" className={field} />
            <input name="phone" placeholder="07xx xxx xxx" className={field} />
            <textarea name="notes" rows={2} placeholder="Anything worth remembering" className={`${field} sm:col-span-2`} />
          </div>
        </ActionForm>
      </div>

      {clients.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
          No clients yet. Add one above, or convert a won lead from the pipeline.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
          {clients.map((c) => (
            <li key={c.id} className="flex items-stretch bg-cream">
              <Link
                href={`/admin/clients/${c.id}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-4 transition-colors hover:bg-cream-deep"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{c.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {c.company ?? "—"} · {c.phone ?? c.email ?? "no contact"}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted">
                  since {shortDate(c.created_at)}
                </span>
              </Link>
              <Link
                href={`/admin/clients/${c.id}#details`}
                aria-label={`Edit ${c.name}`}
                className="flex shrink-0 items-center border-l border-line px-5 text-sm font-semibold text-accent transition-colors hover:bg-cream-deep"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
