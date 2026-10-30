/**
 * The identity block that appears on every document we send out.
 *
 * ONE source of truth. Proposals, agreements, invoices and anything added
 * later read from here, so a change of address or number is a change in one
 * file rather than a hunt through five generators that have quietly drifted
 * apart.
 *
 * Note the deliberate split from `site.ts`:
 *   site.name        "Biziirise"               — the brand, on the website
 *   letterhead.name  "The Biziirise Solutions" — the business, on paperwork
 * Short name for marketing, full name for anything someone might sign.
 */

export const letterhead = {
  /** Full trading name. Goes at the top of every document. */
  name: "The Biziirise Solutions",
  /** Kept for documents that previously carried the old name. */
  formerName: "Biziirise Digital Agency",
  addressLines: ["Norfolk Towers, Kijabe Street, Block G", "Nairobi, Kenya"],
  phone: "+254 141 025 616",
  /** Sending identity on the verified domain. */
  email: "hello@biziirise.com",
  web: "www.biziirise.com",
} as const;

/** One line, for a document footer. */
export function letterheadFooter(): string {
  return `${letterhead.name}  ·  ${letterhead.addressLines.join(", ")}  ·  ${letterhead.phone}  ·  ${letterhead.web}`;
}

/** Stacked block, for the head of a document or an email signature. */
export function letterheadBlock(): string[] {
  return [
    letterhead.name,
    ...letterhead.addressLines,
    `Tel ${letterhead.phone}`,
    letterhead.email,
    letterhead.web,
  ];
}
