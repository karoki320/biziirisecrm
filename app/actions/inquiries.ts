"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { toE164Kenya } from "@/lib/whatsapp";
import { buildQuote } from "@/lib/quote";

/**
 * The service finder's inquiry.
 *
 * The wa.me CTA stays what it is — one tap, no form — for people who just want
 * to talk. This is the other path: someone who told us what they need first.
 * The lead is written BEFORE the WhatsApp handoff, so a person who fills the
 * form and then never opens WhatsApp is still in the CRM. That was the whole
 * point of asking.
 *
 * Writes go through the service-role client because `leads` is admin-only under
 * RLS and this runs for anonymous visitors. It is a server action, so the key
 * never reaches the browser.
 */

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  business: z.string().trim().min(2, "What is the business called?").max(120),
  phone: z.string().trim().min(9, "We need a phone number we can reach you on.").max(20),
  need: z.string().trim().max(1000).optional(),
  service: z.string().trim().max(80).optional(), // slug
  pkg: z.string().trim().max(80).optional(),
  addOns: z.array(z.string().max(80)).max(5).default([]),
  // Honeypot. A human never sees it, so anything in it is a bot.
  website: z.string().max(0).optional(),
});

export type InquiryState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  whatsappUrl?: string;
};

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    business: formData.get("business"),
    phone: formData.get("phone"),
    need: formData.get("need") ?? undefined,
    service: formData.get("service") ?? undefined,
    pkg: formData.get("pkg") ?? undefined,
    addOns: formData.getAll("addOn").map(String),
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

  const { name, business, phone, need, service, pkg, addOns, website } = parsed.data;

  // Priced on the server from lib/services.ts, never from what the browser sent.
  const quote = service ? buildQuote(service, pkg, addOns) : null;
  const quoteLines = quote?.lines ?? [];

  // Silently succeed for bots — never tell them which check they failed.
  if (website) return { whatsappUrl: buildWhatsAppUrl({ name, business, quoteLines, need }) };

  const e164 = toE164Kenya(phone);
  if (!e164) {
    return {
      fieldErrors: {
        phone: "That does not look like a Kenyan number. Try 07xx or 01xx.",
      },
    };
  }

  const context =
    [quote?.service.title, quote?.pkg?.name].filter(Boolean).join(" · ") || "Service finder";

  if (isSupabaseConfigured()) {
    try {
      const head = await headers();
      const admin = createAdminClient();

      // Someone who enquires twice is one lead with a newer note, not two.
      const { data: existing } = await admin
        .from("leads")
        .select("id, message")
        .eq("whatsapp_phone", e164)
        .maybeSingle();

      const message = [
        quoteLines.length ? `Quote shown:\n${quoteLines.join("\n")}` : null,
        need ? `They said: ${need}` : null,
        `Business: ${business}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      if (existing) {
        await admin
          .from("leads")
          .update({
            name,
            page_context: context,
            message: `${message}\n\n— earlier —\n${existing.message ?? ""}`.slice(0, 4000),
            last_contacted_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("leads").insert({
          name,
          phone: `+${e164}`,
          whatsapp_phone: e164,
          source: "website",
          page_context: context,
          message,
          status: "new",
          notes: `User agent: ${head.get("user-agent")?.slice(0, 200) ?? "unknown"}`,
        });
      }
    } catch {
      // A database hiccup must not cost us the conversation. Fall through to
      // WhatsApp anyway — a lead in the chat beats an error on the screen.
    }
  }

  return { whatsappUrl: buildWhatsAppUrl({ name, business, quoteLines, need }) };
}

function buildWhatsAppUrl(input: {
  name: string;
  business: string;
  quoteLines: string[];
  need?: string;
}) {
  const lines = [`Hi Biziirise, I'm ${input.name} from ${input.business}.`];
  if (input.quoteLines.length) {
    lines.push("", "I'd like to go ahead with this quote:", ...input.quoteLines);
  } else {
    lines.push("I'd like a quote.");
  }
  if (input.need) lines.push("", input.need);

  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}
