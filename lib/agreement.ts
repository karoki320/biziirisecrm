import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { site } from "./site";
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
  write(site.legalName.toUpperCase(), { font: bold, size: 9, color: ACCENT });
  space(6);
  write("Agreement for services", { font: bold, size: 20 });
  space(2);
  write(
    `Reference ${input.reference} · Terms version ${TERMS_VERSION}`,
    { size: 9, color: MUTED },
  );
  rule();

  // ------------------------------ the parties ------------------------------
  write("The parties", { font: bold, size: 12, gap: 4 });

  const rows: [string, string][] = [
    ["Provider", `${site.legalName}, Norfolk Towers, Kijabe Street, Nairobi`],
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
  write("Acceptance", { font: bold, size: 12, gap: 4 });
  write(
    `${input.fullName}, for and on behalf of ${input.business}, accepted these terms ` +
      `electronically on ${input.acceptedAt.toUTCString()} by ticking the acceptance box at ` +
      `${site.url}/agreement.`,
    { size: 10 },
  );
  space(4);
  write(
    `Recorded at: ${input.acceptedAt.toISOString()}${input.ip ? ` · from ${input.ip}` : ""}`,
    { size: 9, color: MUTED },
  );
  space(4);
  write(
    "Under the Kenya Information and Communications Act, an electronic acceptance recorded " +
      "this way has the same legal effect as a handwritten signature. No physical signing is " +
      "required for this agreement to be binding on both parties.",
    { size: 9, color: MUTED },
  );

  rule();

  // ------------------------------ the terms ------------------------------
  write("Terms of engagement", { font: bold, size: 12, gap: 6 });

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
      `${site.legalName} · Agreement ${input.reference} · Page ${i + 1} of ${pages.length}`,
      { x: MARGIN, y: MARGIN - 24, size: 8, font: body, color: MUTED },
    );
  });

  pdf.setTitle(`Biziirise agreement — ${input.business}`);
  pdf.setAuthor(site.legalName);
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
