import { redirect } from "next/navigation";
import { TeamPanel } from "@/components/admin/team-panel";
import { isAdmin } from "@/lib/admin";
import { listInvites, listTeam } from "@/lib/team";
import { inviteState } from "@/lib/team-shared";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  // The proxy already blocks staff from this path. This is the second lock,
  // because a page is its own entry point and the data below is read with
  // the service-role key.
  if (!(await isAdmin())) redirect("/admin");

  const [members, invites] = await Promise.all([listTeam(), listInvites()]);
  const inviteStates = Object.fromEntries(
    invites.map((i) => [i.id, inviteState(i)] as const),
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Team</h1>
      <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
        Sales can work leads, clients and projects. Invoices, payments and this page
        stay with you.
      </p>

      <div className="mt-7 max-w-2xl">
        <TeamPanel
          members={members}
          invites={invites}
          origin={site.url}
          inviteStates={inviteStates}
        />
      </div>
    </div>
  );
}
