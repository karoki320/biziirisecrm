import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role, TeamInvite, TeamMember } from "@/lib/team-shared";

/**
 * The team, with emails.
 *
 * Emails live in auth.users, which PostgREST deliberately will not expose,
 * so this is one of the few places the service-role key is the right tool.
 * Every caller checks isAdmin() first — see the page.
 */
export async function listTeam(): Promise<TeamMember[]> {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role, full_name, phone, created_at")
    .in("role", ["admin", "staff"])
    .order("created_at", { ascending: true });

  if (!profiles?.length) return [];

  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const byId = new Map((users?.users ?? []).map((u) => [u.id, u] as const));

  return profiles.map((p) => {
    const user = byId.get(p.id);
    return {
      id: p.id,
      email: user?.email ?? null,
      full_name: p.full_name,
      phone: p.phone,
      role: p.role as Role,
      last_sign_in_at: user?.last_sign_in_at ?? null,
      created_at: p.created_at,
    };
  });
}

/** Invites that are still worth looking at: open, or recently dealt with. */
export async function listInvites(): Promise<TeamInvite[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_invites")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);
  return (data ?? []) as TeamInvite[];
}

/** One invite, by its token. Service-role only — a token is never checked in the browser. */
export async function findInviteByToken(token: string): Promise<TeamInvite | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  return (data as TeamInvite | null) ?? null;
}
