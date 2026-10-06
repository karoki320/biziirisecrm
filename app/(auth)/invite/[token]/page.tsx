import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/admin/accept-invite-form";
import { Logo } from "@/components/logo";
import { findInviteByToken } from "@/lib/team";
import { ROLE_LABELS, inviteState } from "@/lib/team-shared";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { site } from "@/lib/site";

/** An invite link must never be indexed, cached or previewed. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your invite",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mx-auto flex items-center gap-2.5">
        <Logo className="h-7 w-auto text-brand" />
        <span className="text-xl font-extrabold tracking-tight text-ink">{site.name}</span>
      </Link>
      <div className="mt-8 rounded-card border border-line bg-surface p-6">{children}</div>
    </main>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <p className="text-base text-muted">This is not connected yet.</p>
      </Shell>
    );
  }

  const invite = await findInviteByToken(token);

  // One message for every failure. A link that is wrong, cancelled, used or
  // old all read the same from outside, so a stranger with a guessed token
  // learns nothing from the difference.
  if (!invite || inviteState(invite) !== "open") {
    return (
      <Shell>
        <h1 className="text-xl font-extrabold text-ink">This link doesn&rsquo;t work</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          It may have been used already, cancelled, or it may have expired. Ask for a
          new one.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-[48px] items-center text-sm font-bold text-accent underline underline-offset-4"
        >
          Go to sign in
        </Link>
      </Shell>
    );
  }

  const roleLabel = ROLE_LABELS[invite.role];

  return (
    <Shell>
      <h1 className="text-xl font-extrabold leading-tight text-ink">
        {invite.full_name ? `${invite.full_name}, you're` : "You're"} on the {site.name} team
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        This sets up your login for <span className="font-semibold text-ink">{invite.email}</span> as{" "}
        <span className="font-semibold text-ink">{roleLabel}</span>. There is no password
        &mdash; next time, ask for a sign-in link from the login page.
      </p>

      <div className="mt-6">
        <AcceptInviteForm token={token} roleLabel={roleLabel} />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Only open this on your own phone or computer. Anyone who has this link can
        take the account.
      </p>
    </Shell>
  );
}
