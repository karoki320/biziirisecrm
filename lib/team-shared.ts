/**
 * Types and labels shared by the server queries and the browser UI.
 *
 * Kept apart from lib/team.ts on purpose: that module imports the
 * service-role client and is marked "server-only", so anything a client
 * component needs has to live here or the build refuses — correctly.
 */

export type Role = "admin" | "staff" | "client";

export type TeamMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  last_sign_in_at: string | null;
  created_at: string;
};

export type TeamInvite = {
  id: string;
  token: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type InviteState = "open" | "accepted" | "revoked" | "expired";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Owner",
  staff: "Sales",
  client: "Client",
};

export const ROLE_BLURBS: Record<"admin" | "staff", string> = {
  admin: "Everything, including invoices, payments and the team.",
  staff: "Leads, clients and projects. No invoices, no payments, no team.",
};

export function inviteState(invite: TeamInvite): InviteState {
  if (invite.revoked_at) return "revoked";
  if (invite.accepted_at) return "accepted";
  if (new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return "open";
}
