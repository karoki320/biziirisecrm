"use server";

import { createHash, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getPortalSession } from "@/lib/portal";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { letterhead } from "@/lib/letterhead";
import { TERMS_VERSION } from "@/lib/terms";
import { buildAgreementPdf, buildSignedCustomPdf, agreementReference } from "@/lib/agreement";

/**
 * Signing the service agreement in the portal.
 *
 * The client already holds the agreement on paper. In the portal they read the
 * same thing and sign it with a finger (phone) or mouse (computer). We stamp
 * the drawn signature into the PDF, file it in their documents, keep the
 * signature image on its own, and record who/when/from where in `agreements`.
 */

export type SignState = {
  ok?: boolean;
  reference?: string;
  documentId?: string | null;
  emailed?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** Signatures are small line drawings — anything bigger is not one. */
const MAX_SIGNATURE_BYTES = 400 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const signSchema = z.object({
  requestId: z.string().uuid("This signing link is not valid."),
  fullName: z.string().trim().min(2, "Type your full name as it should appear.").max(80),
  signature: z
    .string()
    .startsWith("data:image/png;base64,", "Draw your signature in the box first."),
  accept: z.literal("on", { message: "Tick the box to confirm you agree." }),
});

function decodeSignature(dataUrl: string): Uint8Array | null {
  const b64 = dataUrl.slice("data:image/png;base64,".length);
  if (b64.length > (MAX_SIGNATURE_BYTES * 4) / 3 + 8) return null;
  const bytes = new Uint8Array(Buffer.from(b64, "base64"));
  if (bytes.byteLength < 100 || bytes.byteLength > MAX_SIGNATURE_BYTES) return null;
  if (!PNG_MAGIC.every((b, i) => bytes[i] === b)) return null;
  return bytes;
}

export async function signAgreementInPortal(
  _prev: SignState,
  formData: FormData,
): Promise<SignState> {
  if (!isSupabaseConfigured()) return { error: "The portal is not connected yet." };

  const session = await getPortalSession();
  if (!session) redirect("/login?next=/portal/agreement");
  if (!session.clientId) return { error: "Your login is not linked to a business yet. Message us." };

  const parsed = signSchema.safeParse({
    requestId: formData.get("requestId"),
    fullName: formData.get("fullName"),
    signature: formData.get("signature") ?? "",
    accept: formData.get("accept"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }
  const v = parsed.data;

  const signaturePng = decodeSignature(v.signature);
  if (!signaturePng) {
    return { fieldErrors: { signature: "That signature could not be read. Clear it and sign again." } };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Signing is not available right now. Please message us." };
  }

  // The request must belong to THIS client and still be open. Checked with the
  // service key, so the client_id filter here is what keeps clients apart.
  const { data: request } = await admin
    .from("signature_requests")
    .select(
      "id, client_id, email, service, package, status, kind, title, custom_path, custom_sha256, project_id, clients(name, company, email, phone)",
    )
    .eq("id", v.requestId)
    .eq("client_id", session.clientId)
    .maybeSingle();

  if (!request) return { error: "We could not find that agreement. Refresh and try again." };
  if (request.status !== "pending") return { error: "This agreement has already been signed." };

  const c = (Array.isArray(request.clients) ? request.clients[0] : request.clients) as
    | { name: string; company: string | null; email: string | null; phone: string | null }
    | null;
  const business = c?.company || c?.name || session.clientName || "Client";
  const email = request.email || session.email || c?.email || "";

  const signedAt = new Date();
  const reference = agreementReference(signedAt);
  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? head.get("x-real-ip") ?? null;

  const isCustom = request.kind === "custom" && request.custom_path;
  const title = request.title || "Service agreement";

  let pdf: Uint8Array;
  try {
    if (isCustom) {
      const { data: file, error: dlError } = await admin.storage
        .from("client-documents")
        .download(request.custom_path!);
      if (dlError || !file) return { error: "We could not open the agreement. Please message us." };
      const original = new Uint8Array(await file.arrayBuffer());
      const sha = createHash("sha256").update(original).digest("hex");
      // The file must be the one we sent. If it changed, refuse rather than sign something else.
      if (request.custom_sha256 && request.custom_sha256 !== sha) {
        return { error: "This agreement changed after it was sent. Please message us for a fresh copy." };
      }
      pdf = await buildSignedCustomPdf({
        original,
        originalSha256: sha,
        title,
        fullName: v.fullName,
        business,
        email,
        signedAt,
        reference,
        ip,
        signaturePng,
      });
    } else {
      pdf = await buildAgreementPdf({
        fullName: v.fullName,
        business,
        email,
        phone: c?.phone ?? null,
        service: request.service,
        pkg: request.package,
        acceptedAt: signedAt,
        reference,
        ip,
        signaturePng,
      });
    }
  } catch {
    return { error: "We could not create your signed copy. Please try again." };
  }

  // Under the client's own folder, so the portal's storage rules let them download it.
  const folder = `${session.clientId}/agreements`;
  const pdfPath = `${folder}/${reference}.pdf`;
  const sigPath = `${folder}/${reference}-signature.png`;

  const up1 = await admin.storage
    .from("client-documents")
    .upload(pdfPath, pdf, { contentType: "application/pdf", upsert: false });
  const up2 = await admin.storage
    .from("client-documents")
    .upload(sigPath, signaturePng, { contentType: "image/png", upsert: false });
  if (up1.error || up2.error) {
    return { error: "We could not save your signed copy. Please try again." };
  }

  const { data: doc } = await admin
    .from("documents")
    .insert({
      client_id: session.clientId,
      project_id: request.project_id ?? null,
      storage_path: pdfPath,
      file_name: `Signed — ${title} ${reference}.pdf`,
      mime_type: "application/pdf",
      size_bytes: pdf.byteLength,
      uploaded_by: session.userId,
    })
    .select("id")
    .single();

  const { data: agreement, error: agreementError } = await admin
    .from("agreements")
    .insert({
      client_id: session.clientId,
      full_name: v.fullName,
      business,
      email: email || "unknown",
      phone: c?.phone ?? null,
      service: request.service,
      package: request.package,
      terms_version: isCustom ? `custom:${request.custom_sha256 ?? "unknown"}` : TERMS_VERSION,
      accepted_at: signedAt.toISOString(),
      ip,
      user_agent: head.get("user-agent")?.slice(0, 300) ?? null,
      storage_path: pdfPath,
      document_id: doc?.id ?? null,
      signed_via: "drawn",
      signature_path: sigPath,
      signature_request_id: request.id,
    })
    .select("id")
    .single();

  if (agreementError) {
    return { error: "Your signature was saved but not recorded. Please message us so we can finish it." };
  }

  await admin
    .from("signature_requests")
    .update({ status: "signed", signed_at: signedAt.toISOString(), agreement_id: agreement.id })
    .eq("id", request.id);

  await admin.from("activity_log").insert({
    client_id: session.clientId,
    actor_id: session.userId,
    type: "agreement.signed",
    description: `${v.fullName} signed “${title}” (${reference}).`,
    metadata: { reference, agreement_id: agreement.id },
  });

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    const to = [email, site.inbox].filter(Boolean);
    const result = await sendEmail({
      to,
      subject: `Signed: ${title} — ${reference}`,
      html: signedEmailHtml(v.fullName, business, reference, title),
      text:
        `Hi ${v.fullName},\n\nThank you for signing. Your signed copy of "${title}" is attached — ` +
        `reference ${reference}. A copy is also in your portal under Documents.\n\n${letterhead.name}`,
      tags: [{ name: "type", value: "agreement-signed" }],
      attachments: [
        { filename: `Signed agreement ${reference}.pdf`, content: Buffer.from(pdf).toString("base64") },
      ],
    });
    emailed = result.ok;
  }

  revalidatePath("/portal");
  revalidatePath("/portal/documents");
  revalidatePath(`/admin/clients/${session.clientId}`);

  return { ok: true, reference, documentId: doc?.id ?? null, emailed };
}

// ----------------------------------------------------------------- admin

export type AdminState = { error?: string; ok?: string };

const MAX_CUSTOM_BYTES = 4 * 1024 * 1024;

/**
 * Create a signing request for a client from an admin form. Reads:
 *   agreementKind  "standard" | "custom"
 *   agreementFile  the PDF, when custom
 *   agreementTitle optional, e.g. "Website build — Majito"
 *   projectId, service, pkg, fullName, email
 * Used by the invite form and the "Ask to sign" form alike.
 */
export async function createSignatureRequest(
  clientId: string,
  formData: FormData,
  defaults: { fullName?: string; email?: string } = {},
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  if (!(await isAdmin())) return { error: "Only an admin can ask a client to sign." };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const kind = str("agreementKind") === "custom" ? "custom" : "standard";
  const projectId = str("projectId") || null;
  let title = str("agreementTitle") || null;

  let customPath: string | null = null;
  let customSha: string | null = null;

  if (kind === "custom") {
    const file = formData.get("agreementFile");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Custom agreement chosen — attach the PDF." };
    }
    if (file.size > MAX_CUSTOM_BYTES) return { error: "That PDF is over 4MB. Compress it and try again." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    // "%PDF" — refuse Word files and photos, which the client could not sign onto.
    if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
      return { error: "The agreement must be a PDF. In Word: File → Save As → PDF." };
    }
    customSha = createHash("sha256").update(bytes).digest("hex");
    customPath = `${clientId}/agreements/to-sign/${randomUUID()}.pdf`;
    title ||= file.name.replace(/\.pdf$/i, "") || "Agreement";

    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return { error: "SUPABASE_SERVICE_ROLE_KEY is not set, so the PDF cannot be uploaded." };
    }
    const { error: upError } = await admin.storage
      .from("client-documents")
      .upload(customPath, bytes, { contentType: "application/pdf", upsert: false });
    if (upError) return { error: `Upload failed: ${upError.message}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // One open request per project (or per client, without a project) — replace older pending ones.
  let cancel = supabase
    .from("signature_requests")
    .update({ status: "cancelled" })
    .eq("client_id", clientId)
    .eq("status", "pending");
  cancel = projectId ? cancel.eq("project_id", projectId) : cancel.is("project_id", null);
  await cancel;

  const { error } = await supabase.from("signature_requests").insert({
    client_id: clientId,
    kind,
    title,
    custom_path: customPath,
    custom_sha256: customSha,
    project_id: projectId,
    full_name: str("fullName") || defaults.fullName || null,
    email: str("email").toLowerCase() || defaults.email || null,
    service: str("service") || null,
    package: str("pkg") || null,
    requested_by: user?.id ?? null,
  });
  return error ? { error: error.message } : {};
}

export async function requestSignature(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  if (!(await isAdmin())) redirect("/admin");

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Missing client." };

  const result = await createSignatureRequest(clientId, formData);
  if (result.error) return { error: result.error };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: "Done. They'll see it to sign next time they open the portal." };
}

export async function cancelSignatureRequest(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!isSupabaseConfigured()) return { error: "Not configured." };
  if (!(await isAdmin())) redirect("/admin");

  const id = String(formData.get("requestId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("signature_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: "Request cancelled." };
}

function signedEmailHtml(name: string, business: string, reference: string, title: string) {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!,
    );
  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#14181f;line-height:1.6">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0b5c87;margin:0 0 18px">${esc(letterhead.name)}</p>
  <h1 style="font-size:22px;margin:0 0 16px">Thank you for signing</h1>
  <p style="margin:0 0 14px">Hi ${esc(name)},</p>
  <p style="margin:0 0 14px">Your signed copy of <strong>${esc(title)}</strong> for ${esc(business)} is attached, with your signature on it.</p>
  <p style="margin:0 0 14px">Reference <strong>${reference}</strong>. You can also download it any time from your portal under <a href="${site.url}/portal/documents" style="color:#0b5c87">Documents</a>.</p>
  <p style="margin:24px 0 0;color:#5b6472;font-size:14px">Any questions, just reply to this email.<br>${esc(letterhead.name)} &middot; Nairobi</p>
</div>`.trim();
}
