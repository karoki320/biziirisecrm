"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { site } from "@/lib/site";
import { toE164Kenya } from "@/lib/whatsapp";
import { phoneLoginEmail } from "@/lib/phone-login";
import { createSignatureRequest } from "@/app/actions/signatures";
import { findOpenInvite, hashInviteToken as hash } from "@/lib/client-invites";

/**
 * Invite a client to the portal over WhatsApp — no email involved.
 *
 *  1. We create a one-time link and open WhatsApp with a message ready to send.
 *  2. They open the link, choose a password (twice), and they are signed in.
 *  3. From then on: phone number + password on the login page.
 *
 * Forgot password? Send them a fresh invite — it sets a new password on the
 * same account.
 */

const INVITE_DAYS = 7;

export type WhatsAppInviteState = {
  error?: string;
  ok?: string;
  link?: string;
  whatsappUrl?: string;
};

export async function createWhatsAppInvite(
  _prev: WhatsAppInviteState,
  formData: FormData,
): Promise<WhatsAppInviteState> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  if (!(await isAdmin())) redirect("/admin");

  const clientId = String(formData.get("clientId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const e164 = toE164Kenya(String(formData.get("phone") ?? ""));
  if (!clientId) return { error: "Missing client." };
  if (!e164) return { error: "Enter a Kenyan number, e.g. 0712 345 678." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("name, company, whatsapp_phone")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return { error: "Client not found." };

  // Older open invites for this number stop working — only the newest link counts.
  await supabase
    .from("client_invites")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("phone", e164)
    .is("used_at", null)
    .is("cancelled_at", null);

  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("client_invites").insert({
    client_id: clientId,
    phone: e164,
    full_name: fullName || null,
    token_hash: hash(token),
    expires_at: new Date(Date.now() + INVITE_DAYS * 864e5).toISOString(),
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  if (!client.whatsapp_phone) {
    await supabase.from("clients").update({ whatsapp_phone: e164 }).eq("id", clientId);
  }

  // Optional: put an agreement in their portal to sign.
  let note = "";
  if (formData.get("requestSignature") === "on") {
    const r = await createSignatureRequest(clientId, formData, { fullName });
    note = r.error
      ? ` (But the agreement request failed: ${r.error})`
      : " They'll be asked to sign the agreement once they're in.";
  }

  const link = `${site.url}/join/${token}`;
  const first = fullName.split(" ")[0];
  const message =
    `Hi${first ? ` ${first}` : ""}, this is ${site.name}. Here is your link to the ` +
    `${client.company || client.name} client portal:\n\n${link}\n\n` +
    `Open it, choose a password and you're in. Next time, sign in at ${site.url}/login ` +
    `with this phone number and your password.`;

  revalidatePath(`/admin/clients/${clientId}`);
  return {
    ok: `Invite ready. Tap “Send on WhatsApp”. The link works for ${INVITE_DAYS} days.${note}`,
    link,
    whatsappUrl: `https://wa.me/${e164}?text=${encodeURIComponent(message)}`,
  };
}

// ------------------------------------------------------------ the client side

export type JoinState = { error?: string; fieldErrors?: Record<string, string> };

export async function acceptWhatsAppInvite(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { fieldErrors: { password: "Use at least 8 characters." } };
  if (password !== confirm) return { fieldErrors: { confirm: "The two passwords don't match." } };

  const invite = await findOpenInvite(token);
  if (!invite) return { error: "This link has expired or was already used. Ask us for a new one." };

  const email = phoneLoginEmail(invite.phone)!;
  const admin = createAdminClient();

  // New account, or — if this number already has one — a new password on it.
  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: invite.fullName, phone: invite.phone },
  });

  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users.find((u) => u.email === email);
    if (!existing) return { error: "We could not set up your login. Please message us." };
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (error) return { error: "We could not save your password. Please try again." };
    userId = existing.id;
  }

  // Point the account at this client. Never touch staff/admin accounts' roles.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  await admin
    .from("profiles")
    .upsert({
      id: userId,
      client_id: invite.clientId,
      full_name: invite.fullName,
      phone: invite.phone,
      role: profile?.role && profile.role !== "client" ? profile.role : "client",
    });

  await admin
    .from("client_invites")
    .update({ used_at: new Date().toISOString(), user_id: userId })
    .eq("id", invite.id);

  await admin.from("activity_log").insert({
    client_id: invite.clientId,
    actor_id: userId,
    type: "portal.joined",
    description: `${invite.fullName ?? "A new user"} set up their portal login.`,
  });

  // Sign them straight in.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/login?joined=1");

  revalidatePath("/portal", "layout");
  redirect("/portal");
}

/** Login with phone number + password. */
export async function signInWithPhone(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "The client portal is not connected yet." };

  const email = phoneLoginEmail(String(formData.get("phone") ?? ""));
  if (!email) return { error: "Enter your phone number, e.g. 0712 345 678." };
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That phone number and password don't match." };

  revalidatePath("/portal", "layout");
  const next = String(formData.get("next") ?? "/portal");
  redirect(next.startsWith("/") ? next : "/portal");
}
