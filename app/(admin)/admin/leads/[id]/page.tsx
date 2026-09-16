import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLead, LEAD_STAGES } from "@/lib/admin";
import { shortDate } from "@/lib/portal";
import { setLeadStatus, saveLeadNotes, convertLeadToClient } from "@/app/actions/admin";
import { StageSelect } from "@/components/admin/stage-select";
import { ActionForm } from "@/components/admin/action-form";
import { whatsappLink } from "@/lib/site";
import { toE164Kenya } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Lead", robots: { index: false, follow: false } };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const wa = lead.whatsapp_phone ?? (lead.phone ? toE164Kenya(lead.phone) : null);

  return (
    <>
      <Link href="/admin/leads" className="text-sm font-medium text-muted transition-colors hover:text-ink">
        <span aria-hidden="true">←</span> Pipeline
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{lead.name}</h1>
        <StageSelect
          action={setLeadStatus}
          id={lead.id}
          current={lead.status}
          options={LEAD_STAGES}
          label="Lead stage"
        />
      </div>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Source", lead.page_context ? `${lead.source} · ${lead.page_context}` : lead.source],
          ["Phone", lead.phone ?? "—"],
          ["Email", lead.email ?? "—"],
          ["First seen", shortDate(lead.created_at)],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream px-5 py-4">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Message on WhatsApp
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="rounded-full border-2 border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint"
          >
            Email
          </a>
        )}
        {!wa && !lead.email && (
          <p className="text-sm text-muted">
            No contact details on this lead — add them before you can reach out.{" "}
            <a href={whatsappLink("CRM")} className="text-accent">Your own WhatsApp</a>
          </p>
        )}
      </div>

      {lead.message && (
        <section className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            What they said
          </h2>
          <blockquote className="mt-3 rounded-card border-l-2 border-accent bg-cream-deep px-6 py-5 leading-relaxed text-ink">
            {lead.message}
          </blockquote>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Notes</h2>
        <ActionForm action={saveLeadNotes} submitLabel="Save notes" className="mt-3">
          <input type="hidden" name="id" value={lead.id} />
          <textarea
            name="notes"
            rows={6}
            defaultValue={lead.notes ?? ""}
            placeholder="What was agreed, what they are worried about, what to follow up on."
            className="w-full rounded-card border border-line bg-cream px-4 py-3 leading-relaxed text-ink outline-none transition-colors focus:border-accent"
          />
        </ActionForm>
      </section>

      <section className="mt-12 rounded-card border border-line bg-cream-deep p-6">
        {lead.converted_client_id ? (
          <>
            <h2 className="font-bold text-ink">Already a client</h2>
            <Link
              href={`/admin/clients/${lead.converted_client_id}`}
              className="mt-2 inline-block text-sm font-semibold text-accent"
            >
              Open their client record →
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-bold text-ink">Won the work?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Creates a client record from these details, marks the lead won, and keeps
              the two linked so you can always trace where a client came from.
            </p>
            <ActionForm action={convertLeadToClient} submitLabel="Convert to client">
              <input type="hidden" name="id" value={lead.id} />
            </ActionForm>
          </>
        )}
      </section>
    </>
  );
}
