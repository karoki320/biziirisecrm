import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { BRAND_MARK } from "./brand-mark";
import { letterhead } from "./letterhead";
import {
  KES_FMT,
  PAYMENT_TERMS,
  findPackage,
  type PaymentTermKey,
  type ScopeSection,
} from "./proposal-packages";

/**
 * Builds the proposal PDF from whatever was ticked on the form in the CRM.
 *
 * Same pdf-lib approach as the agreement, same reasons: no browser, no
 * headless anything, runs inside a server action in a fraction of a second.
 *
 * The scope and exclusions are not written here — they come from the packages
 * that were selected, so the document can never promise something that is not
 * in the price, and the price can never be for something the document forgot
 * to describe.
 */

export type ProposalLine = {
  label: string;
  detail: string;
  amount: number;
  /** A retainer sits outside the project total and is marked per month. */
  recurring?: "month";
};

export type ProposalInput = {
  client: string;
  contactName?: string | null;
  title: string;
  /** Package keys, in the order they should appear. */
  packages: string[];
  /** Rows typed by hand on the form, appended after the packages. */
  extraLines: ProposalLine[];
  paymentTerms: PaymentTermKey;
  weeks: number;
  /** KES per year from year two. 0 hides the whole paragraph. */
  renewalPerYear: number;
  validUntil: Date;
  issuedAt: Date;
  /** Appears as a live link they can tap. Blank hides the box. */
  demoUrl?: string | null;
  reference: string;
};

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 52;
const INK = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.36, 0.39, 0.45);
const ACCENT = rgb(0.043, 0.36, 0.53);
const BRAND = rgb(0.063, 0.608, 0.988);
const LINE = rgb(0.91, 0.89, 0.82);
const CREAM = rgb(0.988, 0.976, 0.941);
const TINT = rgb(0.886, 0.945, 0.984);
const WHITE = rgb(1, 1, 1);

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

/**
 * pdf-lib's standard fonts are WinAnsi - a character outside that set throws
 * at draw time and takes the whole download with it. Everything written into
 * the PDF goes through here first.
 *
 * WinAnsi DOES cover Latin-1 (U+00A0-U+00FF), so the middle dot separator and
 * the accented letters in "cafe\u0301" survive. What it does not cover is
 * General Punctuation, where curly quotes and en dashes live - those are
 * folded to their ASCII equivalents rather than dropped, so "don't" never
 * becomes "dont".
 *
 * Caught by reading the rendered output: the first version stripped everything
 * above 0x7E and quietly ate every separator in the footer and the address.
 */
function ascii(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "\u00B7")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, "");
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function proposalReference(at: Date): string {
  const stamp = at.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PR-${stamp}-${rand}`;
}

export async function buildProposalPdf(input: ProposalInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mark = await pdf.embedPng(BRAND_MARK.bytes);
  /** Height for a given width, so the mark never stretches. */
  const markH = (w: number) => (w * BRAND_MARK.height) / BRAND_MARK.width;

  const width = A4[0] - MARGIN * 2;

  // ---- assemble content from the chosen packages ----
  const chosen = input.packages.map(findPackage).filter((p) => p !== undefined);

  const lines: ProposalLine[] = [
    ...chosen.map((p) => ({
      label: p.label,
      detail: p.detail,
      amount: p.amount,
      recurring: p.recurring,
    })),
    ...input.extraLines,
  ];

  const oneOff = lines.filter((l) => !l.recurring);
  const monthly = lines.filter((l) => l.recurring === "month");
  const total = oneOff.reduce((t, l) => t + l.amount, 0);
  const monthlyTotal = monthly.reduce((t, l) => t + l.amount, 0);

  const scope: ScopeSection[] = [];
  for (const p of chosen) {
    for (const section of p.includes) {
      const existing = scope.find((s) => s.heading === section.heading);
      if (existing) {
        for (const pt of section.points) {
          if (!existing.points.includes(pt)) existing.points.push(pt);
        }
      } else {
        scope.push({ heading: section.heading, points: [...section.points] });
      }
    }
  }
  const excludes: string[] = [];
  for (const p of chosen) {
    for (const e of p.excludes) if (!excludes.includes(e)) excludes.push(e);
  }

  // ---- page machinery ----
  let page: PDFPage = pdf.addPage(A4);
  let y = 0;
  let pageNo = 0;

  const paint = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: CREAM });
  };

  const footer = (p: PDFPage) => {
    p.drawLine({
      start: { x: MARGIN, y: 50 },
      end: { x: MARGIN + width, y: 50 },
      thickness: 0.6,
      color: LINE,
    });
    const left = `${letterhead.name}  ·  ${letterhead.addressLines.join(", ")}`;
    const right = `${letterhead.phone}  ·  ${letterhead.web}`;
    p.drawText(ascii(left), { x: MARGIN, y: 38, size: 6.6, font: body, color: MUTED });
    p.drawText(ascii(right), {
      x: MARGIN + width - body.widthOfTextAtSize(ascii(right), 6.6),
      y: 38,
      size: 6.6,
      font: body,
      color: MUTED,
    });
  };

  const head = (p: PDFPage) => {
    const w = 15;
    p.drawImage(mark, { x: MARGIN, y: A4[1] - 48, width: w, height: markH(w) });
    p.drawText(ascii(letterhead.name), {
      x: MARGIN + w + 7,
      y: A4[1] - 46,
      size: 9,
      font: bold,
      color: INK,
    });
    const r = ascii(`Proposal for ${input.client}`);
    p.drawText(r, {
      x: MARGIN + width - body.widthOfTextAtSize(r, 8),
      y: A4[1] - 46,
      size: 8,
      font: body,
      color: MUTED,
    });
    p.drawLine({
      start: { x: MARGIN, y: A4[1] - 56 },
      end: { x: MARGIN + width, y: A4[1] - 56 },
      thickness: 0.6,
      color: LINE,
    });
  };

  const newPage = () => {
    page = pdf.addPage(A4);
    paint(page);
    pageNo += 1;
    head(page);
    footer(page);
    y = A4[1] - 80;
  };

  /** Reserve vertical space, starting a page when the block will not fit. */
  const space = (n: number, keep = 0) => {
    y -= n;
    if (y - keep < 72) {
      newPage();
      y -= n;
    }
  };

  const text = (
    s: string,
    o: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      gap?: number;
      indent?: number;
      maxWidth?: number;
    } = {},
  ) => {
    const f = o.font ?? body;
    const size = o.size ?? 9.4;
    const indent = o.indent ?? 0;
    for (const l of wrap(ascii(s), f, size, (o.maxWidth ?? width) - indent)) {
      space(size * 1.5);
      page.drawText(l, { x: MARGIN + indent, y, size, font: f, color: o.color ?? INK });
    }
    if (o.gap) space(o.gap);
  };

  const heading = (s: string) => {
    space(16, 30);
    text(s, { font: bold, size: 11.5, color: ACCENT, gap: 3 });
  };

  const bullet = (s: string) => {
    const size = 9;
    const linesOut = wrap(ascii(s), body, size, width - 14);
    linesOut.forEach((l, i) => {
      space(size * 1.52);
      if (i === 0) {
        page.drawText("-", { x: MARGIN, y, size, font: body, color: ACCENT });
      }
      page.drawText(l, { x: MARGIN + 12, y, size, font: body, color: INK });
    });
  };

  /** A single table row drawn as a banded rectangle with up to three columns. */
  const row = (
    cols: { t: string; w: number; font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; align?: "l" | "r" }[],
    o: { bg?: ReturnType<typeof rgb>; height?: number; border?: boolean } = {},
  ) => {
    const h = o.height ?? 26;
    space(h, 0);
    if (o.bg) {
      page.drawRectangle({ x: MARGIN, y: y - 7, width, height: h, color: o.bg });
    }
    if (o.border !== false) {
      page.drawLine({
        start: { x: MARGIN, y: y - 7 },
        end: { x: MARGIN + width, y: y - 7 },
        thickness: 0.5,
        color: LINE,
      });
    }
    let x = MARGIN + 8;
    for (const c of cols) {
      const f = c.font ?? body;
      const size = c.size ?? 9;
      // Columns do not wrap, so a long description has to be cut rather than
      // allowed to run under the amount beside it. Seen in testing: a retainer
      // description printed straight through "5,000 / month".
      const room = c.w - 16;
      let s = ascii(c.t);
      if (f.widthOfTextAtSize(s, size) > room) {
        while (s.length > 1 && f.widthOfTextAtSize(`${s}...`, size) > room) {
          s = s.slice(0, -1);
        }
        s = `${s.trimEnd()}...`;
      }
      const tx = c.align === "r" ? x + c.w - 16 - f.widthOfTextAtSize(s, size) : x;
      page.drawText(s, { x: tx, y: y + 2, size, font: f, color: c.color ?? INK });
      x += c.w;
    }
  };

  // ================= COVER =================
  paint(page);
  page.drawRectangle({ x: 0, y: 0, width: 20, height: A4[1], color: ACCENT });
  footer(page);
  pageNo = 0;

  const coverMarkW = 44;
  page.drawImage(mark, {
    x: MARGIN,
    y: A4[1] - 96 - markH(coverMarkW),
    width: coverMarkW,
    height: markH(coverMarkW),
  });

  y = A4[1] - 96 - markH(coverMarkW) - 16;
  text(letterhead.name, { font: bold, size: 19, color: INK });
  space(2);
  text(letterhead.addressLines.join("  ·  "), { size: 8.6, color: MUTED });

  space(90);
  text("BUSINESS PROPOSAL", { font: bold, size: 8.6, color: ACCENT, gap: 8 });
  text(input.title, { font: bold, size: 24, color: INK, maxWidth: width - 40 });
  space(6);

  space(40);
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + width, y },
    thickness: 2,
    color: BRAND,
  });
  space(18);

  const metaRow = (k: string, v: string, strong = false) => {
    space(17);
    page.drawText(ascii(k), { x: MARGIN, y, size: 8, font: body, color: MUTED });
    page.drawText(ascii(v), {
      x: MARGIN + 100,
      y,
      size: 9.4,
      font: strong ? bold : body,
      color: INK,
    });
  };
  metaRow("Prepared for", input.client, true);
  if (input.contactName) metaRow("Attention", input.contactName);
  metaRow("Prepared by", letterhead.name);
  metaRow("Reference", input.reference);
  metaRow("Date issued", fmtDate(input.issuedAt));
  metaRow("Valid until", fmtDate(input.validUntil));

  space(60);
  page.drawRectangle({ x: MARGIN, y: y - 14, width, height: 54, color: ACCENT });
  page.drawText("TOTAL INVESTMENT", {
    x: MARGIN + 18,
    y: y + 10,
    size: 8,
    font: bold,
    color: rgb(0.73, 0.85, 0.93),
  });
  const totalStr = `KES ${KES_FMT.format(total)}`;
  page.drawText(totalStr, {
    x: MARGIN + width - 18 - bold.widthOfTextAtSize(totalStr, 19),
    y: y + 4,
    size: 19,
    font: bold,
    color: WHITE,
  });
  space(30);
  if (monthlyTotal > 0) {
    text(`Plus KES ${KES_FMT.format(monthlyTotal)} per month for the retained services below.`, {
      size: 8.4,
      color: MUTED,
    });
  } else {
    text("Full breakdown inside.", { size: 8.4, color: MUTED });
  }

  // ================= SCOPE =================
  newPage();
  text("What is included", { font: bold, size: 16, color: INK, gap: 6 });

  if (input.demoUrl) {
    space(6);
    const boxTop = y + 10;
    const boxH = 58;
    page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxH,
      width,
      height: boxH,
      color: TINT,
      borderColor: ACCENT,
      borderWidth: 1,
    });
    page.drawText("See it working before you decide", {
      x: MARGIN + 12,
      y: boxTop - 18,
      size: 9.6,
      font: bold,
      color: ACCENT,
    });
    const blurb = ascii(
      "A demo you can tap through on your own phone, set up in your name:",
    );
    page.drawText(blurb, {
      x: MARGIN + 12,
      y: boxTop - 32,
      size: 8.4,
      font: body,
      color: INK,
    });
    page.drawText(ascii(input.demoUrl), {
      x: MARGIN + 12,
      y: boxTop - 46,
      size: 8.6,
      font: bold,
      color: ACCENT,
    });
    y = boxTop - boxH - 6;
  }

  scope.forEach((section) => {
    heading(section.heading);
    section.points.forEach(bullet);
  });

  if (excludes.length) {
    heading("Not included in this price");
    text(
      "Stated plainly so there are no surprises later. Any of these can be quoted separately if you want them.",
      { size: 8.8, color: MUTED, gap: 3 },
    );
    excludes.forEach(bullet);
  }

  // ================= MONEY =================
  space(18, 200);
  text("Investment", { font: bold, size: 16, color: INK, gap: 4 });

  const cW = [width * 0.44, width * 0.34, width * 0.22];
  row(
    [
      { t: "Item", w: cW[0], font: bold },
      { t: "", w: cW[1] },
      { t: "Amount (KES)", w: cW[2], font: bold, align: "r" },
    ],
    { bg: WHITE, height: 24 },
  );
  for (const l of oneOff) {
    row([
      { t: l.label, w: cW[0] },
      { t: l.detail, w: cW[1], size: 8.2, color: MUTED },
      { t: KES_FMT.format(l.amount), w: cW[2], align: "r" },
    ]);
  }
  space(30, 0);
  page.drawRectangle({ x: MARGIN, y: y - 7, width, height: 30, color: ACCENT });
  page.drawText("Total", { x: MARGIN + 8, y: y + 3, size: 11, font: bold, color: WHITE });
  const tStr = KES_FMT.format(total);
  page.drawText(tStr, {
    x: MARGIN + width - 16 - bold.widthOfTextAtSize(tStr, 12),
    y: y + 3,
    size: 12,
    font: bold,
    color: WHITE,
  });

  if (monthly.length) {
    heading("Retained services, charged monthly");
    for (const l of monthly) {
      row([
        { t: l.label, w: cW[0] },
        { t: l.detail, w: cW[1], size: 8.2, color: MUTED },
        { t: `${KES_FMT.format(l.amount)} / month`, w: cW[2], align: "r" },
      ]);
    }
    space(6);
    text(
      "Retainers run month to month. Either side may stop them with one month's notice, and they are invoiced separately from the project above.",
      { size: 8.4, color: MUTED },
    );
  }

  if (input.renewalPerYear > 0) {
    heading("Included for the first year");
    text(
      `Hosting, your domain name, the SSL certificate, daily backups and our support are all covered within the KES ${KES_FMT.format(total)} for twelve months from handover.`,
    );
    space(4);
    text(
      `From the second year, these continue at KES ${KES_FMT.format(input.renewalPerYear)} per year, covering hosting, domain renewal, SSL, backups, security updates and support by phone and WhatsApp. It is the only recurring cost from us. You are told before it falls due, and you are free to decline it.`,
    );
  }

  const terms = PAYMENT_TERMS[input.paymentTerms];
  heading("Payment terms");
  for (const [pct, when, why] of terms.rows) {
    const amount = Math.round((parseInt(pct, 10) / 100) * total);
    row([
      { t: pct, w: 54, font: bold, size: 11, color: ACCENT },
      { t: `KES ${KES_FMT.format(amount)} ${when}`, w: width * 0.42, font: bold },
      { t: why, w: width - 54 - width * 0.42, size: 8.2, color: MUTED },
    ]);
  }
  space(6);
  text(
    `Payable by M-Pesa or bank transfer to ${letterhead.name}. This proposal and its prices are valid until ${fmtDate(input.validUntil)}.`,
    { size: 8.4, color: MUTED },
  );

  heading("Timeline");
  text(
    `${input.weeks} weeks from the deposit clearing, provided the information and material we need reach us in week one.`,
    { size: 8.8, color: MUTED, gap: 3 },
  );
  for (let w = 1; w <= input.weeks; w += 1) {
    const what =
      w === 1
        ? "Design signed off, content and products loaded, anything to be ordered is ordered"
        : w === input.weeks
          ? "Installed, staff trained, go live"
          : "Build, integrations connected and tested";
    row([
      { t: `Week ${w}`, w: 70, font: bold },
      { t: what, w: width - 70, size: 8.4, color: MUTED },
    ]);
  }

  heading("What we need from you");
  [
    "The content, photos and prices for what you sell",
    "Your logo and brand colours, if you have them",
    "Any account details the integrations need, or a decision to apply for them",
    "One person we can reach for decisions while the work runs",
  ].forEach(bullet);

  // ================= ACCEPTANCE =================
  space(24, 190);
  page.drawLine({
    start: { x: MARGIN, y: y + 6 },
    end: { x: MARGIN + width, y: y + 6 },
    thickness: 1.2,
    color: ACCENT,
  });
  text("Acceptance", { font: bold, size: 12.5, color: INK, gap: 2 });
  text(
    "Signing below accepts this proposal and its terms, and authorises us to begin on receipt of the deposit.",
    { size: 8.8, color: MUTED },
  );

  space(34);
  const half = width / 2;
  page.drawText(ascii(`For ${input.client}`), {
    x: MARGIN,
    y,
    size: 8.4,
    font: body,
    color: MUTED,
  });
  page.drawText(ascii(`For ${letterhead.name}`), {
    x: MARGIN + half,
    y,
    size: 8.4,
    font: body,
    color: MUTED,
  });

  for (const label of ["Name", "Signature and date"]) {
    space(34);
    for (const x of [MARGIN, MARGIN + half]) {
      page.drawLine({
        start: { x, y: y + 4 },
        end: { x: x + half - 24, y: y + 4 },
        thickness: 0.6,
        color: LINE,
      });
      page.drawText(label, { x, y: y - 8, size: 7.8, font: body, color: MUTED });
    }
  }

  space(34);
  text(
    `Questions before you sign? Call or WhatsApp ${letterhead.phone}, or email ${letterhead.email}. We would rather answer them now than after.`,
    { size: 8.2, color: MUTED },
  );

  // page numbers, now that the count is known
  const all = pdf.getPages();
  all.forEach((p, i) => {
    if (i === 0) return;
    const label = ascii(`Page ${i} of ${all.length - 1}`);
    p.drawText(label, {
      x: A4[0] / 2 - bold.widthOfTextAtSize(label, 6.6) / 2,
      y: 27,
      size: 6.6,
      font: bold,
      color: ACCENT,
    });
  });

  pdf.setTitle(`Proposal - ${input.client}`);
  pdf.setAuthor(letterhead.name);
  pdf.setSubject(input.title);

  return pdf.save();
}
