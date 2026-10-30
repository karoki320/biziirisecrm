import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isStaff } from "@/lib/admin";
import { buildProposalPdf, proposalReference } from "@/lib/proposal";
import { PACKAGES, PAYMENT_TERMS } from "@/lib/proposal-packages";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Generates a proposal PDF and hands it straight back as a download.
 *
 * A route rather than a server action because the answer is a 100 KB binary,
 * not a piece of state: the browser gets a real file with a real filename and
 * the form keeps whatever was typed into it.
 *
 * /api/admin/* is NOT covered by the proxy matcher, so this checks its own
 * caller. Sales can generate proposals; that is their job.
 */

const schema = z.object({
  client: z.string().trim().min(1, "Who is this for?").max(120),
  contactName: z.string().trim().max(120).optional(),
  title: z.string().trim().min(1).max(160),
  packages: z.array(z.enum(PACKAGES.map((p) => p.key) as [string, ...string[]])).max(12),
  extraLines: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        detail: z.string().trim().max(200).default(""),
        amount: z.number().int().min(0).max(100_000_000),
      }),
    )
    .max(12)
    .default([]),
  paymentTerms: z.enum(Object.keys(PAYMENT_TERMS) as [string, ...string[]]),
  weeks: z.number().int().min(1).max(26),
  renewalPerYear: z.number().int().min(0).max(10_000_000),
  validDays: z.number().int().min(1).max(365),
  demoUrl: z.string().trim().max(300).optional(),
});

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not connected." }, { status: 503 });
  }
  if (!(await isStaff())) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const v = parsed.data;

  if (v.packages.length === 0 && v.extraLines.length === 0) {
    return NextResponse.json({ error: "Add at least one line." }, { status: 400 });
  }

  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + v.validDays * 24 * 60 * 60 * 1000);

  const bytes = await buildProposalPdf({
    client: v.client,
    contactName: v.contactName || null,
    title: v.title,
    packages: v.packages,
    extraLines: v.extraLines.map((l) => ({
      label: l.label,
      detail: l.detail,
      amount: l.amount,
    })),
    paymentTerms: v.paymentTerms as keyof typeof PAYMENT_TERMS,
    weeks: v.weeks,
    renewalPerYear: v.renewalPerYear,
    validUntil,
    issuedAt,
    demoUrl: v.demoUrl || null,
    reference: proposalReference(issuedAt),
  });

  const safe = v.client.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "client";

  return new NextResponse(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Proposal-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
