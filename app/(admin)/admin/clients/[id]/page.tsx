import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getClient,
  getClientProjects,
  getClientInvoices,
  getClientActivity,
  getClientPortalUsers,
} from "@/lib/admin";
import {
  updateClientRecord,
  inviteClientToPortal,
  revokePortalAccess,
} from "@/app/actions/clients";
import { PROJECT_STAGES, kes, shortDate, INVOICE_LABEL } from "@/lib/portal";
import { setProjectStatus, createProject, createInvoice } from "@/app/actions/admin";
import { StageSelect } from "@/components/admin/stage-select";
import { ActionForm } from "@/components/admin/action-form";

export const metadata: Metadata = { title: "Client", robots: { index: false, follow: false } };

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [projects, invoices, activity, portalUsers] = await Promise.all([
    getClientProjects(id),
    getClientInvoices(id),
    getClientActivity(id),
    getClientPortalUsers(id),
  ]);

  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "partly_paid")
    .reduce((s, i) => s + (Number(i.amount_kes) - Number(i.paid_kes)), 0);

  return (
    <>
      <Link href="/admin/clients" className="text-sm font-medium text-muted transition-colors hover:text-ink">
        <span aria-hidden="true">←</span> Clients
      </Link>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {client.name}
      </h1>
      {client.company && <p className="mt-1 text-muted">{client.company}</p>}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Phone", client.phone ?? "—"],
          ["Email", client.email ?? "—"],
          ["Projects", String(projects.length)],
          ["Outstanding", kes(outstanding)],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream px-5 py-4">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {/* ------------------------------------------------ portal access */}
      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Portal access
        </h2>

        {portalUsers.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {portalUsers.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 bg-cream px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{u.full_name ?? "Portal user"}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {u.role} · added {shortDate(u.created_at)}
                  </p>
                </div>
                <ActionForm action={revokePortalAccess} submitLabel="Remove access" compact>
                  <input type="hidden" name="profileId" value={u.id} />
                  <input type="hidden" name="clientId" value={client.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-dashed border-line px-5 py-4 text-sm leading-relaxed text-muted">
            Nobody from this business can log in yet.
          </p>
        )}

        <div className="mt-5 rounded-card border border-line bg-cream-deep p-6">
          <h3 className="font-bold text-ink">Invite someone to the portal</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Sends them an email with a sign-in link. They land straight in their
            projects, documents and invoices — and can only ever see this client&rsquo;s.
          </p>
          <ActionForm action={inviteClientToPortal} submitLabel="Send invitation" className="mt-5">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="email"
                type="email"
                required
                defaultValue={client.email ?? ""}
                placeholder="their@email.co.ke"
                className={field}
              />
              <input name="fullName" placeholder="Their name (optional)" className={field} />
            </div>
          </ActionForm>
        </div>
      </section>

      {/* ------------------------------------------------- edit details */}
      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Details
        </h2>
        <div className="mt-4 rounded-card border border-line bg-cream-deep p-6">
          <ActionForm action={updateClientRecord} submitLabel="Save details">
            <input type="hidden" name="id" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required defaultValue={client.name} placeholder="Client name" className={field} />
              <input name="company" defaultValue={client.company ?? ""} placeholder="Business name" className={field} />
              <input name="email" type="email" defaultValue={client.email ?? ""} placeholder="Email" className={field} />
              <input name="phone" defaultValue={client.phone ?? ""} placeholder="07xx xxx xxx" className={field} />
              <textarea
                name="notes"
                rows={3}
                defaultValue={client.notes ?? ""}
                placeholder="Anything worth remembering"
                className={`${field} sm:col-span-2`}
              />
            </div>
          </ActionForm>
        </div>
      </section>

      {/* ---------------------------------------------------- projects */}
      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Projects</h2>

        {projects.length > 0 && (
          <ul className="mt-4 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 bg-cream px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {kes(p.price_kes)} · created {shortDate(p.created_at)}
                  </p>
                </div>
                <StageSelect
                  action={setProjectStatus}
                  id={p.id}
                  current={p.status}
                  options={PROJECT_STAGES}
                  extra={{ clientId: client.id }}
                  label={`Stage for ${p.name}`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 rounded-card border border-line bg-cream-deep p-6">
          <h3 className="font-bold text-ink">New project</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Changing its stage later writes the client&rsquo;s activity feed and, from
            Phase 4, sends them a WhatsApp update automatically.
          </p>
          <ActionForm action={createProject} submitLabel="Create project" className="mt-5">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Project name" className={field} />
              <input name="price" type="number" min="0" step="1" placeholder="Agreed price (KES)" className={field} />
              <textarea name="summary" rows={2} placeholder="One line the client will see" className={`${field} sm:col-span-2`} />
            </div>
          </ActionForm>
        </div>
      </section>

      {/* ---------------------------------------------------- invoices */}
      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Invoices</h2>

        {invoices.length > 0 && (
          <ul className="mt-4 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 bg-cream px-5 py-4">
                <div className="min-w-0">
                  <Link href="/admin/invoices" className="font-medium text-ink hover:text-accent">
                    {inv.number}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {INVOICE_LABEL[inv.status]} · due {shortDate(inv.due_date)}
                  </p>
                </div>
                <p className="font-mono text-sm font-bold text-accent">{kes(inv.amount_kes)}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 rounded-card border border-line bg-cream-deep p-6">
          <h3 className="font-bold text-ink">New invoice</h3>
          <ActionForm action={createInvoice} submitLabel="Create invoice" className="mt-5">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="amount" type="number" min="1" step="1" required placeholder="Amount (KES)" className={field} />
              <input name="dueDate" type="date" className={field} />
              <input name="description" placeholder="What it is for" className={`${field} sm:col-span-2`} />
            </div>
          </ActionForm>
        </div>
      </section>

      {/* ---------------------------------------------------- activity */}
      {activity.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">Activity</h2>
          <ul className="mt-4 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 bg-cream px-5 py-3">
                <span className="text-sm leading-relaxed text-ink">{a.description}</span>
                <time dateTime={a.created_at} className="font-mono text-xs text-muted">
                  {shortDate(a.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
