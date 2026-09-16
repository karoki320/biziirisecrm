import Link from "next/link";
import type { Metadata } from "next";
import {
  getPortalSession,
  getProjects,
  getActivity,
  getInvoices,
  PROJECT_STAGES,
  stageIndex,
  kes,
  shortDate,
  INVOICE_LABEL,
} from "@/lib/portal";
import { StatusTimeline } from "@/components/portal/status-timeline";

export const metadata: Metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};

export default async function PortalHome() {
  const [session, projects, activity, invoices] = await Promise.all([
    getPortalSession(),
    getProjects(),
    getActivity(),
    getInvoices(),
  ]);

  const firstName = session?.fullName?.split(" ")[0];
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "partly_paid");

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {firstName ? `Hello ${firstName}` : "Your projects"}
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        Where everything we are building for you currently stands.
      </p>

      {outstanding.length > 0 && (
        <Link
          href="/portal/invoices"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent bg-accent-tint px-6 py-5 transition-colors hover:bg-accent-tint/70"
        >
          <span className="font-semibold text-ink">
            {outstanding.length === 1
              ? "You have one invoice awaiting payment"
              : `You have ${outstanding.length} invoices awaiting payment`}
          </span>
          <span className="font-mono text-sm font-semibold text-accent">
            {kes(outstanding.reduce((sum, i) => sum + (i.amount_kes - i.paid_kes), 0))} due →
          </span>
        </Link>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Projects
        </h2>

        {projects.length === 0 ? (
          <p className="mt-5 rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
            Nothing here yet. As soon as a project starts it will appear on this
            page, and you will be able to follow it through to delivery.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/portal/projects/${project.id}`}
                  className="block rounded-card border border-line bg-cream p-7 transition-colors hover:border-accent"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-bold text-ink">{project.name}</h3>
                    <span className="font-mono text-xs text-muted">
                      {PROJECT_STAGES[Math.max(0, stageIndex(project.status))].label}
                    </span>
                  </div>
                  {project.summary && (
                    <p className="mt-2 leading-relaxed text-muted">{project.summary}</p>
                  )}
                  <div className="mt-6">
                    <StatusTimeline status={project.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activity.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Recent activity
          </h2>
          <ul className="mt-5 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {activity.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-cream px-6 py-4">
                <span className="leading-relaxed text-ink">{item.description}</span>
                <time dateTime={item.created_at} className="font-mono text-xs text-muted">
                  {shortDate(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invoices.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Latest invoice
          </h2>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-cream px-6 py-5">
            <div>
              <p className="font-semibold text-ink">{invoices[0].number}</p>
              <p className="mt-1 text-sm text-muted">
                {INVOICE_LABEL[invoices[0].status]} · due {shortDate(invoices[0].due_date)}
              </p>
            </div>
            <p className="font-mono text-lg font-bold text-accent">
              {kes(invoices[0].amount_kes)}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
