import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Client login",
  robots: { index: false, follow: false },
};

/** Phase 2: Supabase Auth (magic link + password) wires in here. */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-20">
      <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
        <Logo className="h-7 w-auto text-brand" />
        <span className="text-lg font-extrabold tracking-tight text-ink">{site.name}</span>
      </Link>
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">
        Client login
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        Coming in Phase 2. For now, message us on WhatsApp and we will send your
        project update directly.
      </p>
    </main>
  );
}
