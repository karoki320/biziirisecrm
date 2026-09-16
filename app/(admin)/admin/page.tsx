import Link from "next/link";
import type { Metadata } from "next";
import { getCrmSummary, getLeads, staleLeads, LEAD_STAGES } from "@/lib/admin";
import { kes, shortDate } from "@/lib/portal";

export const metadata: Metadata = { title: "CRM", robots: { index: false, follow: false } };

export default async function AdminHome() {
  const [summary, leads] = await Promise.all([getCrmSummary(), getLeads()]);
  const recent = leads.slice(0, 6);
  const stale = staleLeads(leads);

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Overview</h1>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open leads", String(summary.openLeads)],
          ["Clients", String(summary.clients)],
          ["Active projects", String(summary.activeProjects)],
          ["Outstanding", kes(summary.outstandingKes)],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream px-6 py-6">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-2 font-mono text-2xl font-extrabold tracking-tight text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {stale.length > 0 && (
        <div className="mt-8 rounded-card border border-accent bg-accent-tint px-6 py-5">
          <p className="font-semibold text-ink">
            {stale.length === 1
              ? "One lead has been sitting over a week"
              : `${stale.length} leads have been sitting over a week`}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Still at new or contacted. This is where the money leaks.
          </p>
          <Link href="/admin/leads" className="mt-3 inline-block text-sm font-semibold text-accent">
            Work the pipeline →
          </Link>
        </div>
      )}

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Latest leads
          </h2>
          <Link href="/admin/leads" className="text-sm font-semibold text-accent">
            All leads →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-5 rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
            No leads yet. Until the inbound WhatsApp webhook is live in Phase 4, add
            them by hand from the Leads page as they message you.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {recent.map((lead) => (
              <li key={lead.id} className="bg-cream">
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-4 transition-colors hover:bg-cream-deep"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{lead.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {lead.source}
                      {lead.page_context ? ` · ${lead.page_context}` : ""} · {shortDate(lead.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line px-3 py-0.5 font-mono text-[11px] text-muted">
                    {LEAD_STAGES.find((s) => s.key === lead.status)?.label ?? lead.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
