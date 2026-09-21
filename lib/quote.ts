import { services, formatKes, type Pkg, type Service } from "./services";

/**
 * A quote built from what someone picked in the finder.
 *
 * Computed from lib/services.ts on both sides — the browser to show it, the
 * server to write it into the lead and the WhatsApp message — so a price on
 * the screen can never drift from the price on the page.
 */

export type Quote = {
  service: Service;
  pkg: Pkg | null;
  addOns: Pkg[];
  /** One-off and monthly are never added together — they're different bills. */
  onceTotal: number;
  monthlyTotal: number;
  /** True when at least part of it needs a conversation before it has a price. */
  needsChat: boolean;
  /** Plain-text lines, for the WhatsApp message and the CRM. */
  lines: string[];
};

export function buildQuote(slug: string, pkgName?: string | null, addOnNames: string[] = []): Quote | null {
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;

  const pkg = service.packages.find((p) => p.name === pkgName) ?? null;
  const addOns = (service.addOns ?? []).filter((a) => addOnNames.includes(a.name));

  let onceTotal = 0;
  let monthlyTotal = 0;
  let needsChat = !pkg || pkg.price === null;

  for (const item of [pkg, ...addOns]) {
    if (!item) continue;
    if (item.price === null) { needsChat = true; continue; }
    if (item.cadence === "month") monthlyTotal += item.price;
    else onceTotal += item.price;
  }

  const lines: string[] = [];
  if (pkg) {
    lines.push(`${service.title} — ${pkg.name}: ${priceText(pkg)}`);
  } else {
    lines.push(`${service.title} (not sure which package yet)`);
  }
  for (const a of addOns) lines.push(`+ ${a.name}: ${priceText(a)}`);

  const totals: string[] = [];
  if (onceTotal) totals.push(`${formatKes(onceTotal)} one-off`);
  if (monthlyTotal) totals.push(`${formatKes(monthlyTotal)}/month`);
  if (totals.length && (addOns.length || (onceTotal && monthlyTotal))) {
    lines.push(`Total: ${totals.join(" + ")}`);
  }

  return { service, pkg, addOns, onceTotal, monthlyTotal, needsChat, lines };
}

function priceText(p: Pkg) {
  if (p.price === null) return "quoted after a chat";
  return p.cadence === "month" ? `${formatKes(p.price)}/month` : `${formatKes(p.price)} one-off`;
}

/** "KES 35,000 – 120,000" — for when someone hasn't picked a package yet. */
export function priceRange(service: Service): string | null {
  const prices = service.packages.map((p) => p.price).filter((n): n is number => n !== null);
  if (!prices.length) return null;
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const monthly = service.packages.some((p) => p.cadence === "month");
  const suffix = monthly ? "/month" : "";
  return lo === hi ? `${formatKes(lo)}${suffix}` : `${formatKes(lo)} – ${hi.toLocaleString("en-KE")}${suffix}`;
}
