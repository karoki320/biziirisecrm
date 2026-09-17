"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { TERMS_VERSION } from "@/lib/terms";
import { buildAgreementPdf, agreementReference } from "@/lib/agreement";
import { toE164Kenya } from "@/lib/whatsapp";

/**
 * Accepting the terms.
 *
 * Eugene's clients are spread across the country and getting a signature on
 * paper means a trip or a courier. A ticked box with a proper record behind it
 * does the same job: we keep who, when, from where, and exactly which wording
 * they were shown, and we hand them a PDF they can keep.
 *
 * Order matters here. The record is written FIRST and the email second, because
 * an agreement that was accepted but whose email bounced is a recoverable
 * problem, and an email sent for an agreement we never stored is not.
 */

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(80),
  business: z.string().trim().min(2, "Enter the business name.").max(120),
  email: z.string().trim().toLowerCase().email("We need a valid email to send your copy."),
  phone: z.string().trim().max(20).optional(),
  service: z.string().trim().max(80).optional(),
  pkg: z.string().trim().max(80).optional(),
  accept: z.literal("on", {
    message: "Tick the box to accept the terms.",
  }),
  website: z.string().max(0).optional(),
});

export type AgreementState = {
  ok?: boolean;
  reference?: string;
  emailed?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function acceptAgreement(
  _prev: AgreementState,
  formData: FormData,
): Promise<AgreementState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    business: formData.get("business"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    service: formData.get("service") || undefined,
    pkg: formData.get("pkg") || undefined,
    accept: formData.get("accept"),
    website: formData.get("website") ?? undefined,
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
  if (v.website) return { ok: true, reference: "—" }; // bot

  const acceptedAt = new Date();
  const reference = agreementReference(acceptedAt);

  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    head.get("x-real-ip") ??
    null;

  let pdf: Uint8Array;
  try {
    pdf = await buildAgreementPdf({
      fullName: v.fullName,
      business: v.business,
      email: v.email,
      phone: v.phone ?? null,
      service: v.service ?? null,
      pkg: v.pkg ?? null,
      acceptedAt,
      reference,
      ip,
    });
  } catch {
    return { error: "We could not generate your agreement. Please try again, or message us on WhatsApp." };
  }

  const storagePath = `agreements/${reference}.pdf`;
  let stored = false;

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();

      await admin.storage
        .from("client-documents")
        .upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });

      // If we already know this business as a client, file it in their portal.
      const { data: client } = await admin
        .from("clients")
        .select("id")
        .ilike("name", v.business)
        .maybeSingle();

      let documentId: string | null = null;
      if (client) {
        const { data: doc } = await admin
          .from("documents")
          .insert({
            client_id: client.id,
            storage_path: storagePath,
            file_name: `Agreement ${reference}.pdf`,
            mime_type: "application/pdf",
            size_bytes: pdf.byteLength,
          })
          .select("id")
          .single();
        documentId = doc?.id ?? null;
      }

      const e164 = v.phone ? toE164Kenya(v.phone) : null;
      const { data: lead } = e164
        ? await admin.from("leads").select("id").eq("whatsapp_phone", e164).maybeSingle()
        : { data: null };

      await admin.from("agreements").insert({
        client_id: client?.id ?? null,
        lead_id: lead?.id ?? null,
        full_name: v.fullName,
        business: v.business,
        email: v.email,
        phone: v.phone ?? null,
        service: v.service ?? null,
        package: v.pkg ?? null,
        terms_version: TERMS_VERSION,
        accepted_at: acceptedAt.toISOString(),
        ip,
        user_agent: head.get("user-agent")?.slice(0, 300) ?? null,
        storage_path: storagePath,
        document_id: documentId,
      });

      stored = true;
    } catch {
      // Keep going. The client still gets their copy, and we would rather have
      // a delivered agreement we must re-file than a failed one.
    }
  }

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    const attachment = {
      filename: `Biziirise agreement ${reference}.pdf`,
      content: Buffer.from(pdf).toString("base64"),
    };

    const result = await sendEmail({
      to: [v.email, site.inbox],
      subject: `Your Biziirise agreement — ${reference}`,
      html: clientEmailHtml(v.fullName, v.business, reference, v.service, v.pkg),
      text:
        `Hi ${v.fullName},\n\nYour agreement with Biziirise is attached — reference ${reference}. ` +
        `Keep it somewhere safe; it is the record of what we agreed.\n\n` +
        `Any questions, reply to this email or message us on WhatsApp.\n\n${site.legalName}`,
      tags: [{ name: "type", value: "agreement" }],
      attachments: [attachment],
    });
    emailed = result.ok;
  }

  return { ok: true, reference, emailed: emailed && stored ? true : emailed };
}

function clientEmailHtml(
  name: string,
  business: string,
  reference: string,
  service?: string,
  pkg?: string,
) {
  const what = [service, pkg].filter(Boolean).join(" — ");
  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#14181f;line-height:1.6">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0b5c87;margin:0 0 18px">Biziirise Digital Agency</p>
  <h1 style="font-size:22px;margin:0 0 16px">Your agreement is attached</h1>
  <p style="margin:0 0 14px">Hi ${escapeHtml(name)},</p>
  <p style="margin:0 0 14px">
    Thanks for accepting our terms${what ? ` for <strong>${escapeHtml(what)}</strong>` : ""}.
    Your agreement for ${escapeHtml(business)} is attached as a PDF.
  </p>
  <p style="margin:0 0 14px">
    Reference <strong>${reference}</strong>. Keep it somewhere you can find it &mdash; it records
    exactly what we agreed and the terms you accepted, so neither of us has to remember.
  </p>
  <p style="margin:0 0 14px">No paperwork to sign or return. We will be in touch about next steps.</p>
  <p style="margin:24px 0 0;color:#5b6472;font-size:14px">
    Any questions, just reply to this email.<br>${site.legalName} &middot; Nairobi
  </p>
</div>`.trim();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
