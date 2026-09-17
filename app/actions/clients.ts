"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { toE164Kenya } from "@/lib/whatsapp";
import { site } from "@/lib/site";

export type ActionState = { error?: string; ok?: string };

async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Not configured");
  if (!(await isAdmin())) redirect("/portal");
  return createClient();
}

const clientSchema = z.object({
  name: z.string().trim().min(1, "A name is required."),
  company: z.string().trim().optional(),
  email: z.string().trim().email("That email does not look right.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function parseClient(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
}

/** Add a client without touching Supabase. */
export async function createClientRecord(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const parsed = parseClient(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp_phone: parsed.data.phone ? toE164Kenya(parsed.data.phone) : null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientRecord(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = parseClient(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      whatsapp_phone: parsed.data.phone ? toE164Kenya(parsed.data.phone) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
  return { ok: "Saved." };
}

/**
 * Invite a client into the portal.
 *
 * This is the one place in the CRM that needs the service-role key: creating an
 * auth user is an admin-API operation with no user session behind it. It is
 * gated by requireAdmin() above, and the key never leaves the server.
 *
 * Supabase's `handle_new_user` trigger creates the profile row on signup, so
 * all that is left afterwards is pointing that profile at the client.
 */
export async function inviteClientToPortal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const clientId = String(formData.get("clientId") ?? "");
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();

  const email = z.string().email().safeParse(emailRaw);
  if (!email.success) return { error: "Enter a valid email address to invite." };
  if (!clientId) return { error: "Missing client." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set on this environment, so invitations cannot be sent from here.",
    };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: `${site.url}/auth/confirm?next=/portal`,
    data: { full_name: fullName || null },
  });

  // Already has an account: link them rather than failing.
  if (error) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", (await admin.auth.admin.listUsers()).data.users.find((u) => u.email === email.data)?.id ?? "")
      .maybeSingle();

    if (!existing) return { error: error.message };

    await admin.from("profiles").update({ client_id: clientId, full_name: fullName || null }).eq("id", existing.id);
    revalidatePath(`/admin/clients/${clientId}`);
    return { ok: "That email already had an account — it is now linked to this client." };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "Supabase did not return a user." };

  const { error: linkError } = await admin
    .from("profiles")
    .update({ client_id: clientId, full_name: fullName || null, role: "client" })
    .eq("id", userId);

  if (linkError) return { error: `Invited, but linking failed: ${linkError.message}` };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: `Invitation sent to ${email.data}.` };
}

/** Unlink a portal login from a client. Does not delete their account. */
export async function revokePortalAccess(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not set on this environment." };
  }

  const { error } = await admin.from("profiles").update({ client_id: null }).eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: "Access removed. Their login still exists but sees nothing." };
}
