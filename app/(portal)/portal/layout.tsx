import Link from "next/link";
import { redirect } from "next/navigation";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { getPortalSession } from "@/lib/portal";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { PortalGuide, GuideLauncher } from "@/components/guide/portal-guide";
import { getGuideSeen } from "@/app/actions/guide";
import { getDocuments, getInvoices } from "@/lib/portal";
import { getPendingSignatureRequests } from "@/lib/signatures";

/**
 * Never cache an authenticated page. Without Supabase keys these routes return
 * before they touch cookies, which lets Next prerender them as static — safe
 * today, a data-leak shape tomorrow. Declaring it removes the question.
 */
export const dynamic = "force-dynamic";

const nav = [
  { href: "/portal", label: "Overview", guide: "nav-overview" },
  { href: "/portal/documents", label: "Documents", guide: "nav-documents" },
  { href: "/portal/invoices", label: "Invoices", guide: "nav-invoices" },
];

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Phase 1 state: no backend yet. Say so plainly instead of throwing.
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20 text-center">
        <Logo className="mx-auto h-9 w-auto text-brand" />
        <h1 className="mt-7 text-2xl font-extrabold tracking-tight text-ink">
          The portal is not switched on yet
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          We are still building it. In the meantime, message us and we will send
          your project update, documents or invoice directly.
        </p>
        <div className="mt-8 flex justify-center">
          <WhatsAppCta size="md" context="Portal — not live yet" />
        </div>
        <Link href="/" className="mt-8 text-sm font-medium text-accent">
          Back to {site.name}
        </Link>
      </main>
    );
  }

  const session = await getPortalSession();
  if (!session) redirect("/login?next=/portal");

  // Admins and staff have no client of their own, so the portal would show them
  // an empty page. Send them where their work actually is.
  if (session.role === "admin" || session.role === "staff") redirect("/admin");

  // What Bizi needs to know: what they've seen, and what's new for them.
  const [guideSeen, documents, invoices, toSign] = await Promise.all([
    getGuideSeen(),
    getDocuments(),
    getInvoices(),
    getPendingSignatureRequests(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-cream-deep">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <Logo className="h-6 w-auto text-brand" />
            <span className="font-extrabold tracking-tight text-ink">{site.name}</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <GuideLauncher />
            <span className="hidden text-sm text-muted lg:block">
              {session.clientName ?? session.email}
            </span>
            <SignOutButton />
          </div>
        </div>

        <nav aria-label="Portal" className="mx-auto max-w-5xl px-5">
          <ul className="flex gap-6 overflow-x-auto">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  data-guide={item.guide}
                  className="-mb-px inline-block whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <p className="text-xs text-muted">Something wrong here? Message us on {site.phoneDisplay}.</p>
          <div data-guide="help">
            <WhatsAppCta size="md" context="Portal — help" />
          </div>
        </div>
      </footer>

      <PortalGuide
        firstName={session.fullName?.split(" ")[0] ?? null}
        seen={guideSeen}
        facts={{ pendingAgreements: toSign.length, invoices: invoices.length, documents: documents.length }}
      />
    </div>
  );
}
