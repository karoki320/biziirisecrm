import Link from "next/link";
import type { Metadata } from "next";
import { getLeads, LEAD_STAGES } from "@/lib/admin";
import { shortDate } from "@/lib/portal";
import { toE164Kenya } from "@/lib/whatsapp";
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
                    {inStage.map((lead) => {
                      const wa =
                        lead.whatsapp_phone ?? (lead.phone ? toE164Kenya(lead.phone) : null);
                      return (
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
                            {lead.business_name && (
                              <p className="mt-0.5 text-sm text-ink">
                                {lead.business_name}
                                {lead.business_type && (
                                  <span className="text-muted"> · {lead.business_type}</span>
                                )}
                                {lead.location && (
                                  <span className="text-muted"> · {lead.location}</span>
                                )}
                              </p>
                            )}
                            <p className="mt-0.5 font-mono text-xs text-muted">
                              {lead.phone ?? lead.email ?? "no contact"} · {shortDate(lead.created_at)}
                              {lead.utm_source && (
                                <span className="text-accent"> · {lead.utm_source}</span>
                              )}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {wa && (
                              <a
                                href={`https://wa.me/${wa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp ${lead.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#12805c]
                                           px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0d6448]"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.82 14.06c-.24.68-1.22 1.24-1.7 1.28-.44.04-.86.2-2.9-.6-2.44-.96-3.98-3.45-4.1-3.61-.12-.16-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3h.46c.15 0 .35-.06.54.41.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4l-.36.42c-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26Z" />
                                </svg>
                                WhatsApp
                              </a>
                            )}
                            <StageSelect
                              action={setLeadStatus}
                              id={lead.id}
                              current={lead.status}
                              options={LEAD_STAGES}
                              label={`Stage for ${lead.name}`}
                            />
                          </div>
                        </li>
                      );
                    })}
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
