import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Client login",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
      <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
        <Logo className="h-7 w-auto text-brand" />
        <span className="text-lg font-extrabold tracking-tight text-ink">{site.name}</span>
      </Link>

      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">Client login</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Your projects, documents and invoices in one place.
      </p>

      {error === "link" && (
        <p role="alert" className="mt-6 rounded-xl border border-line bg-cream-deep px-4 py-3 text-sm leading-relaxed text-ink">
          That sign-in link has expired or has already been used. Request a new one below.
        </p>
      )}

      <div className="mt-8">
        <LoginForm next={next ?? "/portal"} />
      </div>

      <p className="mt-10 text-sm leading-relaxed text-muted">
        {configured
          ? "Accounts are created by us when a project starts. If you cannot get in, message us on WhatsApp and we will sort it."
          : "The portal is not switched on yet. Message us on WhatsApp and we will send your project update directly."}
      </p>
    </main>
  );
}
