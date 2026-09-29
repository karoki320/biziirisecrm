"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { site } from "@/lib/site";
import { toE164Kenya } from "@/lib/whatsapp";
import { BUSINESS_TYPES, BRANCHES } from "@/lib/lead-form";

/**
 * The /get-started form — the landing point for the Facebook ad.
 *
 * Writes go through the service-role client on the server, never from the
 * browser: the form is public, so anything the browser could do, a bot could
 * do too. Here the honeypot, the validation and the phone normalisation all
 * run before anything is written.
 */

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  phone: z
    .string()
    .trim()
    .min(1, "We need a number to reach you on.")
    // Checked here rather than after, so a wrong number is reported in the
    // same pass as everything else instead of one error at a time.
    .refine((v) => toE164Kenya(v) !== null, {
      message: "That does not look like a Kenyan number. Try 07xx, 01xx or +254…",
    }),
  businessName: z.string().trim().min(2, "What is the business called?").max(120),
  businessType: z.enum(BUSINESS_TYPES, { message: "Pick the closest one." }),
  location: z.string().trim().min(2, "Where are you based?").max(120),
  branches: z.enum(BRANCHES).optional(),
  sellsOnline: z.enum(["Yes", "No"]).optional(),
  message: z.string().trim().max(1000).optional(),
  utmSource: z.string().trim().max(80).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type LeadFormState = {
  ok?: boolean;
  name?: string;
  whatsappUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitGetStarted(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType") || undefined,
    location: formData.get("location"),
    branches: formData.get("branches") || undefined,
    sellsOnline: formData.get("sellsOnline") || undefined,
    message: formData.get("message") || undefined,
    utmSource: formData.get("utmSource") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
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

  // A bot filled the hidden field. Look like success, save nothing.
  if (v.website) return { ok: true, name: v.name, whatsappUrl: waLink(v) };

  const e164 = toE164Kenya(v.phone)!; // the schema already proved this parses

  const sellsOnline = v.sellsOnline ? v.sellsOnline === "Yes" : null;

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const head = await headers();

      // Someone who fills the form twice is one lead, not two.
      const { data: existing } = await admin
        .from("leads")
        .select("id")
        .eq("whatsapp_phone", e164)
        .maybeSingle();

      const row = {
        name: v.name,
        phone: `+${e164}`,
        whatsapp_phone: e164,
        source: v.utmSource ? `ad:${v.utmSource}` : "get-started",
        page_context: "Website + POS system",
        message: v.message ?? null,
        business_name: v.businessName,
        business_type: v.businessType,
        location: v.location,
        branches: v.branches ?? null,
        sells_online: sellsOnline,
        utm_source: v.utmSource ?? null,
        utm_campaign: v.utmCampaign ?? null,
        notes: `User agent: ${head.get("user-agent")?.slice(0, 200) ?? "unknown"}`,
      };

      if (existing) {
        await admin
          .from("leads")
          .update({ ...row, last_contacted_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await admin.from("leads").insert({ ...row, status: "new" });
      }
    } catch {
      // Never lose the customer over our own database trouble — they still
      // get the thank-you screen and the WhatsApp button.
    }
  }

  if (process.env.RESEND_API_KEY) {
    await sendEmail({
      to: site.inbox,
      subject: `New lead: ${v.businessName} (${v.businessType}) — ${v.location}`,
      replyTo: undefined,
      html: leadEmail(v, e164),
      text:
        `${v.name} · +${e164}\n${v.businessName} — ${v.businessType}\n${v.location}\n` +
        `Branches: ${v.branches ?? "—"} · Sells online: ${v.sellsOnline ?? "—"}\n` +
        `${v.message ? `\n"${v.message}"\n` : ""}` +
        `Source: ${v.utmSource ?? "direct"}${v.utmCampaign ? ` / ${v.utmCampaign}` : ""}\n` +
        `Reply: https://wa.me/${e164}`,
      tags: [{ name: "type", value: "lead" }],
    });
  }

  return { ok: true, name: v.name, whatsappUrl: waLink(v) };
}

function waLink(v: { name: string; businessName: string; businessType: string; location: string }) {
  const text =
    `Hi Biziirise, I just filled in the form on your website. ` +
    `My business is ${v.businessName} (${v.businessType}) in ${v.location}.`;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function leadEmail(
  v: z.infer<typeof schema>,
  e164: string,
) {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 14px 6px 0;color:#5b6472;font-size:14px;white-space:nowrap">${label}</td>
      <td style="padding:6px 0;color:#14181f;font-size:15px;font-weight:600">${esc(value)}</td>
    </tr>`;

  return `
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#14181f">
  <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0b5c87;margin:0 0 10px">New lead</p>
  <h1 style="font-size:22px;margin:0 0 4px">${esc(v.businessName)}</h1>
  <p style="margin:0 0 18px;color:#5b6472">${esc(v.businessType)} · ${esc(v.location)}</p>
  <table style="border-collapse:collapse;margin-bottom:22px">
    ${row("Name", v.name)}
    ${row("Phone", `+${e164}`)}
    ${row("Branches", v.branches ?? "—")}
    ${row("Sells online", v.sellsOnline ?? "—")}
    ${row("Came from", v.utmSource ? `${v.utmSource}${v.utmCampaign ? ` / ${v.utmCampaign}` : ""}` : "direct")}
  </table>
  ${v.message ? `<p style="background:#f5efe0;border-radius:10px;padding:14px 16px;margin:0 0 22px;line-height:1.55">${esc(v.message)}</p>` : ""}
  <a href="https://wa.me/${e164}" style="display:inline-block;background:#12805c;color:#fff;text-decoration:none;font-weight:700;padding:13px 24px;border-radius:999px">Reply on WhatsApp</a>
  <p style="margin:22px 0 0;color:#5b6472;font-size:13px">It is already in your pipeline at ${site.url}/admin/leads.</p>
</div>`.trim();
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
