"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { stkPush } from "@/lib/mpesa";
import { toE164Kenya } from "@/lib/whatsapp";

export type ActionState = { error?: string; ok?: string };

/**
 * Every action re-checks admin server-side. The proxy gates the page shell and
 * RLS gates the rows, but an action is its own entry point and is checked on
 * its own terms.
 */
async function requireAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Not configured");
  if (!(await isAdmin())) redirect("/portal");
  return createClient();
}

// ---------------------------------------------------------------- leads

const LEAD_STATUSES = ["new", "contacted", "proposal", "won", "lost"] as const;

export async function setLeadStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) {
    return { error: "Unknown lead or stage." };
  }

  const patch: Record<string, unknown> = { status };
  if (status === "contacted") patch.last_contacted_at = new Date().toISOString();

  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  return { ok: "Stage updated." };
}

export async function saveLeadNotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 8000);

  const { error } = await supabase.from("leads").update({ notes }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/leads/${id}`);
  return { ok: "Saved." };
}

const newLeadSchema = z.object({
  name: z.string().trim().min(1, "A name is required."),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("That email does not look right.").optional().or(z.literal("")),
  source: z.string().trim().default("whatsapp"),
  message: z.string().trim().optional(),
});

/**
 * Manual lead capture. Until the inbound WhatsApp webhook exists this is how
 * every enquiry gets into the CRM, so it is deliberately quick: a name is the
 * only required field.
 */
export async function createLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();

  const parsed = newLeadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    source: formData.get("source") || "whatsapp",
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("leads").insert({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    whatsapp_phone: parsed.data.phone ? toE164Kenya(parsed.data.phone) : null,
    email: parsed.data.email || null,
    source: parsed.data.source,
    message: parsed.data.message || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/leads");
  return { ok: "Lead added." };
}

/** Won lead becomes a client record, and the two stay linked. */
export async function convertLeadToClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) return { error: "Lead not found." };
  if (lead.converted_client_id) return { error: "This lead is already a client." };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      whatsapp_phone: lead.whatsapp_phone,
      notes: lead.notes,
    })
    .select("id")
    .single();

  if (clientError) return { error: clientError.message };

  await supabase
    .from("leads")
    .update({ converted_client_id: client.id, status: "won" })
    .eq("id", id);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

// ------------------------------------------------------------- projects

const PROJECT_STATUSES = ["requested", "in_progress", "review", "delivered"] as const;

export async function setProjectStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const clientId = String(formData.get("clientId") ?? "");

  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    return { error: "Unknown stage." };
  }

  const patch: Record<string, unknown> = { status };
  if (status === "delivered") patch.delivered_at = new Date().toISOString().slice(0, 10);
  if (status === "in_progress") patch.started_at = new Date().toISOString().slice(0, 10);

  // The database trigger writes the activity row and enrols the client in the
  // status-update sequence. Nothing to do here beyond the update itself.
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/portal");
  return { ok: "Stage updated. The client can see it." };
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();

  if (!clientId || !name) return { error: "A project needs a name." };

  const { error } = await supabase.from("projects").insert({
    client_id: clientId,
    name,
    summary: summary || null,
    price_kes: price ? Number(price) : null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: "Project created." };
}

// ------------------------------------------------------------- invoices

export async function createInvoice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!clientId || !(amount > 0)) return { error: "An invoice needs a client and an amount above zero." };

  // Human-readable, sortable, and unique enough for an agency of this size.
  const number = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const { error } = await supabase.from("invoices").insert({
    client_id: clientId,
    number,
    amount_kes: amount,
    description: description || null,
    due_date: dueDate || null,
    status: "sent",
    issued_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/invoices");
  return { ok: `${number} created.` };
}

/**
 * Sends the STK prompt to the client's handset and records the attempt before
 * Safaricom ever calls back, so a callback always has a row to land on.
 */
export async function requestMpesaPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireAdmin();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const rawPhone = String(formData.get("phone") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  const phone = toE164Kenya(rawPhone);
  if (!phone) return { error: "That is not a Kenyan number we can send a prompt to." };
  if (!(amount > 0)) return { error: "Enter an amount above zero." };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("number")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return { error: "Invoice not found." };

  let result;
  try {
    result = await stkPush({
      phone,
      amount,
      accountReference: invoice.number,
      description: "Biziirise",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "M-Pesa is not configured yet." };
  }

  if (!result.ok) return { error: result.error };

  const { error } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount_kes: amount,
    phone,
    status: "pending",
    checkout_request_id: result.checkoutRequestId,
    merchant_request_id: result.merchantRequestId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/invoices");
  return { ok: "Prompt sent. It is on their phone now." };
}
