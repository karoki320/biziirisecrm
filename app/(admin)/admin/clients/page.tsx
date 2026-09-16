import Link from "next/link";
import type { Metadata } from "next";
import { getClients } from "@/lib/admin";
import { shortDate } from "@/lib/portal";

export const metadata: Metadata = { title: "Clients", robots: { index: false, follow: false } };

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Clients</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Every business you work for. Created automatically when you convert a won lead.
      </p>

      {clients.length === 0 ? (
        <p className="mt-8 rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
          No clients yet. Convert a won lead from the pipeline and it lands here.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
          {clients.map((c) => (
            <li key={c.id} className="bg-cream">
              <Link
                href={`/admin/clients/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-4 transition-colors hover:bg-cream-deep"
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
