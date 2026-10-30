import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { site } from "./site";
import { BRAND_MARK } from "./brand-mark";
import { letterhead } from "./letterhead";
import { terms, TERMS_VERSION } from "./terms";

/**
 * Renders the agreement a client receives after ticking the box.
 *
 * Deliberately plain. This is a document someone may one day print and hand to
 * an advocate, so it favours legibility and a clear acceptance record over
 * anything decorative. The full terms are included in the file itself — an
 * agreement that links to terms which can later change is not much of a record.
 */

export type AgreementInput = {
  fullName: string;
  business: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  pkg?: string | null;
  acceptedAt: Date;
  reference: string;
  ip?: string | null;
  /**
   * A signature drawn in the client portal (PNG bytes). When present the PDF
   * shows the signature itself instead of the tick-box wording.
   */
  signaturePng?: Uint8Array | null;
};

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.36, 0.39, 0.45);
const ACCENT = rgb(0.043, 0.36, 0.53);
const LINE = rgb(0.91, 0.89, 0.82);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

export async function buildAgreementPdf(input: AgreementInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mark = await pdf.embedPng(BRAND_MARK.bytes);

  const width = A4[0] - MARGIN * 2;
  let page: PDFPage = pdf.addPage(A4);
  let y = A4[1] - MARGIN;

  const space = (n: number) => {
    y -= n;
    if (y < MARGIN + 40) {
      page = pdf.addPage(A4);
      y = A4[1] - MARGIN;
    }
  };

  const write = (
    text: string,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; gap?: number } = {},
  ) => {
    const font = opts.font ?? body;
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    for (const line of wrap(text, font, size, width)) {
      space(size * 1.45);
      page.drawText(line, { x: MARGIN, y, size, font, color });
    }
    if (opts.gap) space(opts.gap);
  };

  const rule = () => {
    space(10);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + width, y },
      thickness: 0.75,
      color: LINE,
    });
    space(6);
  };

  // ------------------------------ masthead ------------------------------
  {
    const w = 26;
    const h = (w * BRAND_MARK.height) / BRAND_MARK.width;
    page.drawImage(mark, { x: MARGIN, y: y - h + 4, width: w, height: h });
    space(h - 6);
    page.drawText(letterhead.name.toUpperCase(), {
      x: MARGIN + w + 8,
      y: y + 6,
      size: 9,
      font: bold,
      color: ACCENT,
    });
  }
  space(6);
  write("Service agreement", { font: bold, size: 20 });
  space(2);
  write(
    `Reference ${input.reference} · Terms version ${TERMS_VERSION}`,
    { size: 9, color: MUTED },
  );
  rule();

  // ------------------------------ the parties ------------------------------
  write("The parties", { font: bold, size: 12, gap: 4 });

  const rows: [string, string][] = [
    ["Provider", `${letterhead.name}, ${letterhead.addressLines.join(", ")}`],
    ["Contact", `${site.email} · ${site.phone}`],
    ["Client", input.business],
    ["Signed by", input.fullName],
    ["Client email", input.email],
    ...(input.phone ? ([["Client phone", input.phone]] as [string, string][]) : []),
    ...(input.service ? ([["Service", input.service]] as [string, string][]) : []),
    ...(input.pkg ? ([["Package", input.pkg]] as [string, string][]) : []),
  ];

  for (const [label, value] of rows) {
    space(14);
    page.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: MUTED });
    for (const [i, line] of wrap(value, body, 10, width - 110).entries()) {
      if (i > 0) space(13);
      page.drawText(line, { x: MARGIN + 110, y, size: 10, font: body, color: INK });
    }
  }

  rule();

  // ------------------------------ acceptance ------------------------------
  write("Signed", { font: bold, size: 12, gap: 4 });

  if (input.signaturePng) {
    // Drawn in the portal. Scale it into a fixed box so a tiny scribble and a
    // full-width one both come out looking like a signature.
    const sig = await pdf.embedPng(input.signaturePng);
    const boxW = 220;
    const boxH = 80;
    const scale = Math.min(boxW / sig.width, boxH / sig.height);
    const w = sig.width * scale;
    const h = sig.height * scale;

    space(boxH + 8);
    page.drawImage(sig, { x: MARGIN, y, width: w, height: h });
    page.drawLine({
      start: { x: MARGIN, y: y - 4 },
      end: { x: MARGIN + boxW, y: y - 4 },
      thickness: 0.75,
      color: MUTED,
    });
    space(14);
    page.drawText(`${input.fullName}, for and on behalf of ${input.business}`, {
      x: MARGIN, y, size: 9, font: bold, color: INK,
    });
    space(6);
    write(
      `Signed electronically in the ${site.name} client portal on ` +
        `${input.acceptedAt.toUTCString()}.`,
      { size: 10 },
    );
  } else {
    write(
      `${input.fullName}, on behalf of ${input.business}, agreed to these terms ` +
        `online on ${input.acceptedAt.toUTCString()} by ticking the box at ` +
        `${site.url}/agreement.`,
      { size: 10 },
    );
  }
  space(4);
  write(
    `Recorded at: ${input.acceptedAt.toISOString()}${input.ip ? ` · from ${input.ip}` : ""}`,
    { size: 9, color: MUTED },
  );
  space(4);
  write(
    "Under the Kenya Information and Communications Act, an electronic signature like this counts the " +
      "same as a handwritten one. No paper signing is needed.",
    { size: 9, color: MUTED },
  );

  rule();

  // ------------------------------ the terms ------------------------------
  write("The terms", { font: bold, size: 12, gap: 6 });

  for (const clause of terms) {
    space(6);
    write(clause.heading, { font: bold, size: 10.5 });
    space(2);
    for (const paragraph of clause.body) {
      write(paragraph, { size: 9.5, color: MUTED });
      space(3);
    }
  }

  // ------------------------------ footers ------------------------------
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `${letterhead.name} · Agreement ${input.reference} · Page ${i + 1} of ${pages.length}`,
      { x: MARGIN, y: MARGIN - 24, size: 8, font: body, color: MUTED },
    );
  });

  pdf.setTitle(`Biziirise agreement — ${input.business}`);
  pdf.setAuthor(letterhead.name);
  pdf.setSubject(`Agreement reference ${input.reference}`);
  pdf.setCreationDate(input.acceptedAt);

  return pdf.save();
}

/** Short, sayable-over-the-phone, and unique enough at your volume. */
export function agreementReference(at: Date): string {
  const stamp = at.toISOString().slice(0, 10).replace(/-/g, "");
  const salt = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BZR-${stamp}-${salt}`;
}

/**
 * Signs a CUSTOM agreement — a PDF we drew up for one project.
 *
 * The original pages are kept exactly as they were. Two things are added:
 *  - a small "Signed electronically by …" line at the foot of every page, so a
 *    single printed page still shows it was signed;
 *  - a final signature page with the drawn signature, who signed, when, from
 *    where, and a fingerprint (SHA-256) of the original file, which proves the
 *    pages they signed are the pages we sent.
 */
export async function buildSignedCustomPdf(input: {
  original: Uint8Array;
  originalSha256: string;
  title: string;
  fullName: string;
  business: string;
  email: string;
  signedAt: Date;
  reference: string;
  ip?: string | null;
  signaturePng: Uint8Array;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(input.original, { ignoreEncryption: true });
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const sig = await pdf.embedPng(input.signaturePng);
  const mark = await pdf.embedPng(BRAND_MARK.bytes);

  // Footer stamp on every original page.
  const stamp = `Signed electronically by ${input.fullName} for ${input.business} · ${input.reference}`;
  for (const p of pdf.getPages()) {
    const { width } = p.getSize();
    const size = 7;
    const w = body.widthOfTextAtSize(stamp, size);
    p.drawText(stamp, { x: Math.max(12, (width - w) / 2), y: 10, size, font: body, color: MUTED });
  }

  // Signature page.
  const page = pdf.addPage(A4);
  let y = A4[1] - MARGIN;
  const width = A4[0] - MARGIN * 2;
  const text = (t: string, size = 10, font = body, color = INK) => {
    for (const line of wrap(t, font, size, width)) {
      y -= size * 1.5;
      page.drawText(line, { x: MARGIN, y, size, font, color });
    }
  };

  const mw = 26;
  const mh = (mw * BRAND_MARK.height) / BRAND_MARK.width;
  page.drawImage(mark, { x: MARGIN, y: y - mh + 4, width: mw, height: mh });
  page.drawText(letterhead.name.toUpperCase(), { x: MARGIN + mw + 8, y: y - mh + 10, size: 9, font: bold, color: ACCENT });
  y -= mh + 10;

  text("Signature page", 20, bold);
  text(`${input.title} · Reference ${input.reference}`, 9, body, MUTED);
  y -= 16;

  const boxW = 240;
  const boxH = 90;
  const scale = Math.min(boxW / sig.width, boxH / sig.height);
  y -= boxH;
  page.drawImage(sig, { x: MARGIN, y, width: sig.width * scale, height: sig.height * scale });
  page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: MARGIN + boxW, y: y - 4 }, thickness: 0.75, color: MUTED });
  y -= 6;
  text(`${input.fullName}, for and on behalf of ${input.business}`, 10, bold);
  y -= 10;

  const rows: [string, string][] = [
    ["Document", input.title],
    ["Signed by", input.fullName],
    ["Client", input.business],
    ["Email", input.email || "—"],
    ["Signed on", input.signedAt.toUTCString()],
    ["Recorded", `${input.signedAt.toISOString()}${input.ip ? ` · from ${input.ip}` : ""}`],
    ["Method", `Drawn signature in the ${site.name} client portal`],
    ["Original file", `SHA-256 ${input.originalSha256}`],
  ];
  for (const [label, value] of rows) {
    y -= 16;
    page.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: MUTED });
    for (const [i, line] of wrap(value, body, 9, width - 110).entries()) {
      if (i > 0) y -= 12;
      page.drawText(line, { x: MARGIN + 110, y, size: 9, font: body, color: INK });
    }
  }
  y -= 24;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + width, y }, thickness: 0.75, color: LINE });
  y -= 4;
  text(
    "The pages before this one are the agreement exactly as it was sent for signing. Under the Kenya " +
      "Information and Communications Act, an electronic signature like this counts the same as a " +
      "handwritten one.",
    9, body, MUTED,
  );

  pdf.setTitle(`${input.title} — signed`);
  pdf.setSubject(`Signed agreement ${input.reference}`);
  pdf.setModificationDate(input.signedAt);
  return pdf.save();
}
