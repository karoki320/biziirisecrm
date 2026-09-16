import Link from "next/link";
import { redirect } from "next/navigation";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

/** An authenticated back office is never cacheable. */
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/invoices", label: "Invoices" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) redirect("/");

  // proxy.ts gates the shell, RLS gates the rows — this is the third check,
  // because a layout is its own entry point.
  if (!(await isAdmin())) redirect("/portal");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Biziirise CRM">
            <Logo className="h-6 w-auto text-sky" />
            <span className="font-extrabold tracking-tight text-cream">
              {site.name}
              <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-wider text-sky">
                CRM
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-5 text-cream">
            <Link href="/portal" className="hidden text-sm text-cream/70 transition-colors hover:text-cream sm:block">
              Client view
            </Link>
            <div className="[&_button]:text-cream/70 [&_button:hover]:text-cream">
              <SignOutButton />
            </div>
          </div>
        </div>

        <nav aria-label="CRM" className="mx-auto max-w-6xl px-5">
          <ul className="flex gap-6 overflow-x-auto">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="-mb-px inline-block whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-cream/70 transition-colors hover:border-sky hover:text-cream"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
    </div>
  );
}
