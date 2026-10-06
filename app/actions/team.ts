"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { toE164Kenya } from "@/lib/whatsapp";

export type TeamState = { error?: string; ok?: string; link?: string };

/**
 * The team page is the one place in the CRM that can hand out access, so
 * it is owner-only at every layer: the proxy, this guard, and the
 * `team_invites` RLS policy, which is still `is_admin()`.
 */
async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Not configured");
  if (!(await isAdmin())) redirect("/admin");
}

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That does not look like an email address."),
  fullName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["admin", "staff"], { message: "Pick a role." }),
});

/** 32 bytes of real randomness. The token IS the credential. */
function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function inviteTeamMember(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const v = parsed.data;
  const admin = createAdminClient();

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  const token = newToken();
  const { error } = await admin.from("team_invites").insert({
    token,
    email: v.email,
    full_name: v.fullName || null,
    phone: v.phone ? (toE164Kenya(v.phone) ?? v.phone) : null,
    role: v.role,
    invited_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return {
    ok: `Invite ready for ${v.email}. The link works once, and expires in 7 days.`,
    link: `${site.url}/invite/${token}`,
  };
}

export async function revokeInvite(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing invite." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("accepted_at", null);

  if (error) return { error: error.message };
  revalidatePath("/admin/team");
  return { ok: "Invite revoked. That link no longer works." };
}

export async function setMemberRole(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!id) return { error: "Missing member." };
  if (role !== "admin" && role !== "staff") return { error: "Unknown role." };

  const admin = createAdminClient();

  // Never let the last owner demote themselves — that locks everyone out of
  // invoices, payments and this page, with no way back in through the UI.
  if (role === "staff") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { error: "You are the only owner. Make someone else an owner first." };
    }
  }

  const { error } = await admin.from("profiles").update({ role }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return { ok: "Role updated." };
}

/**
 * Take someone off the team.
 *
 * Their profile drops to 'client', which is the role with no CRM access at
 * all. The auth user is left alone deliberately: deleting it would orphan
 * every row that references them, and a login that can reach nothing is
 * harmless.
 */
export async function removeMember(
  _prev: TeamState,
  formData: FormData,
): Promise<TeamState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing member." };

  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (target?.role === "admin" && (count ?? 0) <= 1) {
    return { error: "That is the only owner. The CRM would lock you out." };
  }

  const { error } = await admin.from("profiles").update({ role: "client" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/team");
  return { ok: "Removed from the team." };
}

/* ============================================================
 * Redeeming an invite
 *
 * This runs for a signed-OUT visitor, so it cannot use the session client
 * to check anything — the token in the URL is the only credential there
 * is. That is why it is 32 random bytes, single-use, expiring and
 * revocable, and why it is only ever compared server-side with the
 * service-role key. A token is never sent to the browser to be checked.
 * ============================================================ */

export type AcceptState = { error?: string };

export async function acceptInvite(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  if (!isSupabaseConfigured()) return { error: "Not connected yet." };

  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "That link is incomplete." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("team_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return { error: "That invite link is not valid." };
  if (invite.revoked_at) return { error: "That invite was cancelled." };
  if (invite.accepted_at) return { error: "That invite has already been used." };
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: "That invite has expired. Ask for a new link." };
  }

  // New person → 'invite' creates the auth user. Someone who already has a
  // login (a client being promoted, or a second attempt) → 'magiclink'
  // against the user that exists. Both hand back a one-time token we can
  // verify immediately, without an email round trip.
  let userId: string | null = null;
  let hashedToken: string | null = null;
  let otpType: "invite" | "magiclink" = "invite";

  const created = await admin.auth.admin.generateLink({
    type: "invite",
    email: invite.email,
  });

  if (created.error) {
    const existing = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: invite.email,
    });
    if (existing.error) return { error: existing.error.message };
    userId = existing.data.user?.id ?? null;
    hashedToken = existing.data.properties?.hashed_token ?? null;
    otpType = "magiclink";
  } else {
    userId = created.data.user?.id ?? null;
    hashedToken = created.data.properties?.hashed_token ?? null;
  }

  if (!userId || !hashedToken) {
    return { error: "Could not set up that login. Ask for a new link." };
  }

  // The trigger on auth.users already made a profile row, defaulted to
  // 'client'. This is the line that actually grants the role.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: invite.role,
      full_name: invite.full_name ?? undefined,
      phone: invite.phone ?? undefined,
    })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  await admin
    .from("team_invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq("id", invite.id);

  const supabase = await createClient();
  const { error: sessionError } = await supabase.auth.verifyOtp({
    type: otpType,
    token_hash: hashedToken,
  });

  if (sessionError) return { error: sessionError.message };

  redirect("/admin");
}
