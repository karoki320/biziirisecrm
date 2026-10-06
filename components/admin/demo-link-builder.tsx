"use client";

import { useState } from "react";
import { CATALOGUE_KEYS, type CatalogueKey } from "@/lib/demo/catalogues";

const TYPE_LABELS: Record<CatalogueKey, string> = {
  minimart: "Minimart / shop",
  pharmacy: "Chemist",
  hardware: "Hardware",
  boutique: "Boutique",
  restaurant: "Restaurant / café",
  salon: "Salon / barber",
};

/**
 * Builds the link Eugene walks into a shop with.
 *
 * The prospect's name goes in the URL, not a database, so a link is ready
 * the second it is typed — in the car outside, if that is where he is.
 */
export function DemoLinkBuilder({ origin }: { origin: string }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CatalogueKey>("minimart");
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams({ type });
  if (name.trim()) params.set("for", name.trim());
  const link = `${origin}/demos/shop?${params.toString()}`;

  const waText = `Hi${name.trim() ? ` ${name.trim()}` : ""}, here is the system we talked about — you can tap through it yourself: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <label htmlFor="demo-name" className="block text-sm font-semibold text-ink">
        Business you&rsquo;re pitching
      </label>
      <input
        id="demo-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Baraka Minimart"
        className="mt-1.5 min-h-[52px] w-full rounded-xl border-2 border-line bg-cream px-4 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />
      <p className="mt-1.5 text-xs text-muted">
        Leave it blank for a generic demo.
      </p>

      <p className="mt-5 text-sm font-semibold text-ink">What they sell</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CATALOGUE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            aria-pressed={type === key}
            className={`min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold transition-colors ${
              type === key
                ? "border-accent bg-accent text-cream"
                : "border-line bg-cream text-ink hover:border-accent"
            }`}
          >
            {TYPE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-line bg-cream p-3">
        <p className="break-all font-mono text-xs text-muted">{link}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={copy}
          className="min-h-[52px] rounded-full border-2 border-accent text-sm font-bold text-accent"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="grid min-h-[52px] place-items-center rounded-full bg-[#12805c] text-sm font-bold text-cream"
        >
          Send on WhatsApp
        </a>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="grid min-h-[52px] place-items-center rounded-full bg-accent text-sm font-bold text-cream"
        >
          Open it
        </a>
      </div>
    </div>
  );
}
