import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { JoinForm } from "@/components/auth/join-form";
import { findOpenInvite } from "@/lib/client-invites";
import { prettyKenyanPhone } from "@/lib/phone-login";
import { site } from "@/lib/site";

/** An invite link must never be indexed, cached or previewed. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your portal",
  robots: { index: false, follow: false },
};

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findOpenInvite(token);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mx-auto flex items-center gap-2.5">
        <Logo className="h-7 w-auto text-brand" />
        <span className="text-xl font-extrabold tracking-tight text-ink">{site.name}</span>
      </Link>

      <div className="mt-8 rounded-card border border-line bg-surface p-6">
        {invite ? (
          <>
            <h1 className="text-xl font-extrabold leading-tight text-ink">
              {invite.fullName ? `Welcome, ${invite.fullName.split(" ")[0]}` : "Welcome"}
            </h1>
            <p className="mt-3 leading-relaxed text-muted">
              Choose a password for the <span className="font-semibold text-ink">{invite.business}</span>{" "}
              portal. Next time you&rsquo;ll sign in with your phone number{" "}
              <span className="font-semibold text-ink">{prettyKenyanPhone(invite.phone)}</span> and
              this password.
            </p>
            <JoinForm token={token} phone={prettyKenyanPhone(invite.phone)} />
          </>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-ink">This link doesn&rsquo;t work</h1>
            <p className="mt-3 leading-relaxed text-muted">
              It may have been used already, or it has expired. Message us on WhatsApp and
              we&rsquo;ll send you a new one.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-[48px] items-center text-sm font-bold text-accent underline underline-offset-4"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
