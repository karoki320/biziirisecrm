import { WhatsAppCta } from "./whatsapp-cta";
import { priceLabel, type Pkg } from "@/lib/services";

function Tick() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-[3px] h-4 w-4 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 8 14.5 16 5.5" />
    </svg>
  );
}

export function PackageCard({
  pkg,
  serviceTitle,
}: {
  pkg: Pkg;
  serviceTitle: string;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-card border bg-cream p-7 ${
        pkg.highlight ? "border-accent shadow-[0_18px_40px_-28px_rgba(11,92,135,0.6)]" : "border-line"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold text-ink">{pkg.name}</h3>
        {pkg.highlight && (
          <span className="rounded-full bg-accent-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
            Most chosen
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-extrabold tracking-tight text-accent">
        {priceLabel(pkg)}
      </p>

      <p className="mt-3 leading-relaxed text-muted">{pkg.summary}</p>

      <ul className="mt-6 flex flex-1 flex-col gap-2.5 border-t border-line pt-6">
        {pkg.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
            <Tick />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <WhatsAppCta
          size="md"
          label="Ask about this"
          variant={pkg.highlight ? "solid" : "outline"}
          context={`${serviceTitle} — ${pkg.name}`}
        />
      </div>
    </div>
  );
}
