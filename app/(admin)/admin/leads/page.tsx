import Link from "next/link";
import type { Metadata } from "next";
import { getLeads, LEAD_STAGES } from "@/lib/admin";
import { shortDate } from "@/lib/portal";
import { setLeadStatus, createLead } from "@/app/actions/admin";
import { StageSelect } from "@/components/admin/stage-select";
import { ActionForm } from "@/components/admin/action-form";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Pipeline</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Change a stage and it saves immediately. No drag and drop — this has to work
        on a phone.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {LEAD_STAGES.map((stage) => {
            const inStage = leads.filter((l) => l.status === stage.key);
            return (
              <section key={stage.key}>
                <h2 className="flex items-baseline gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                  {stage.label}
                  <span className="text-ink">{inStage.length}</span>
                </h2>

                {inStage.length === 0 ? (
                  <p className="mt-3 rounded-card border border-dashed border-line px-5 py-4 text-sm text-muted">
                    Nothing here.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
                    {inStage.map((lead) => (
                      <li
                        key={lead.id}
                        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 bg-cream px-5 py-4"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/admin/leads/${lead.id}`}
                            className="font-medium text-ink hover:text-accent"
                          >
                            {lead.name}
                          </Link>
                          <p className="mt-0.5 font-mono text-xs text-muted">
                            {lead.phone ?? lead.email ?? "no contact"} · {shortDate(lead.created_at)}
                          </p>
                        </div>
                        <StageSelect
                          action={setLeadStatus}
                          id={lead.id}
                          current={lead.status}
                          options={LEAD_STAGES}
                          label={`Stage for ${lead.name}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-card border border-line bg-cream-deep p-6">
            <h2 className="font-bold text-ink">Add a lead</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Someone just messaged on WhatsApp? Put them in here before you forget.
            </p>

            <ActionForm action={createLead} submitLabel="Add lead" className="mt-5">
              <div className="flex flex-col gap-3">
                <input name="name" required placeholder="Name" className={field} />
                <input name="phone" placeholder="07xx xxx xxx" className={field} />
                <input name="email" type="email" placeholder="Email (optional)" className={field} />
                <select name="source" defaultValue="whatsapp" className={field}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="other">Other</option>
                </select>
                <textarea name="message" rows={3} placeholder="What do they want?" className={field} />
              </div>
            </ActionForm>
          </div>
        </aside>
      </div>
    </>
  );
}
