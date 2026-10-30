"use client";

import { useMemo, useState } from "react";
import {
  KES_FMT,
  PACKAGES,
  PAYMENT_TERMS,
  type PaymentTermKey,
} from "@/lib/proposal-packages";

type ExtraLine = { label: string; detail: string; amount: string };

const FIELD =
  "mt-1.5 min-h-[48px] w-full rounded-xl border-2 border-line bg-cream px-3.5 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none";

/**
 * The form Eugene fills in on a lead to produce the proposal.
 *
 * Everything that can be derived is derived: tick the packages and the scope,
 * the exclusions, the total and the timeline all follow. The only things typed
 * are the ones only he knows — who it is for, and anything unusual.
 */
export function ProposalBuilder({
  defaultClient,
  defaultContact,
  defaultDemoUrl,
}: {
  defaultClient: string;
  defaultContact: string;
  defaultDemoUrl: string;
}) {
  const [client, setClient] = useState(defaultClient);
  const [contactName, setContactName] = useState(defaultContact);
  const [title, setTitle] = useState("E-commerce Website with Integrated Point of Sale");
  const [picked, setPicked] = useState<string[]>([]);
  const [extras, setExtras] = useState<ExtraLine[]>([]);
  const [terms, setTerms] = useState<PaymentTermKey>("50_50");
  const [weeks, setWeeks] = useState(3);
  const [renewal, setRenewal] = useState("15000");
  const [validDays, setValidDays] = useState("30");
  const [demoUrl, setDemoUrl] = useState(defaultDemoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = useMemo(
    () => PACKAGES.filter((p) => picked.includes(p.key)),
    [picked],
  );

  const extraTotal = extras.reduce((t, l) => t + (parseInt(l.amount, 10) || 0), 0);
  const oneOffTotal =
    chosen.filter((p) => !p.recurring).reduce((t, p) => t + p.amount, 0) + extraTotal;
  const monthlyTotal = chosen
    .filter((p) => p.recurring)
    .reduce((t, p) => t + p.amount, 0);

  const toggle = (key: string) => {
    setPicked((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // The longest thing selected sets the timeline, unless he overrides it.
      const longest = PACKAGES.filter((p) => next.includes(p.key)).reduce(
        (m, p) => Math.max(m, p.weeks),
        0,
      );
      if (longest > 0) setWeeks(longest);
      return next;
    });
  };

  const generate = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: client.trim(),
          contactName: contactName.trim() || undefined,
          title: title.trim(),
          packages: picked,
          extraLines: extras
            .filter((l) => l.label.trim())
            .map((l) => ({
              label: l.label.trim(),
              detail: l.detail.trim(),
              amount: parseInt(l.amount, 10) || 0,
            })),
          paymentTerms: terms,
          weeks,
          renewalPerYear: parseInt(renewal, 10) || 0,
          validDays: parseInt(validDays, 10) || 30,
          demoUrl: demoUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Could not generate that." }));
        setError(data.error ?? "Could not generate that.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposal-${client.trim().replace(/[^\w]+/g, "-") || "client"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const groups = ["Build", "Hardware", "Marketing"] as const;

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-extrabold text-ink">Generate a proposal</h2>
      <p className="mt-1 text-sm text-muted">
        Tick what you are quoting. The scope, exclusions, total and timeline write
        themselves.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pb-client" className="block text-sm font-semibold text-ink">
            Business name
          </label>
          <input
            id="pb-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className={FIELD}
            placeholder="e.g. Baraka Minimart"
          />
        </div>
        <div>
          <label htmlFor="pb-contact" className="block text-sm font-semibold text-ink">
            Contact person <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="pb-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="pb-title" className="block text-sm font-semibold text-ink">
          Proposal title
        </label>
        <input
          id="pb-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={FIELD}
        />
      </div>

      {groups.map((g) => {
        const items = PACKAGES.filter((p) => p.group === g);
        if (!items.length) return null;
        return (
          <fieldset key={g} className="mt-5">
            <legend className="text-sm font-semibold text-ink">{g}</legend>
            <div className="mt-2 space-y-2">
              {items.map((p) => {
                const on = picked.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(p.key)}
                    aria-pressed={on}
                    className={`flex w-full items-start justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      on ? "border-accent bg-accent-tint" : "border-line bg-cream hover:border-accent"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{p.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{p.detail}</span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-accent">
                      {KES_FMT.format(p.amount)}
                      {p.recurring ? "/mo" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Anything else</p>
          <button
            type="button"
            onClick={() => setExtras((e) => [...e, { label: "", detail: "", amount: "" }])}
            className="min-h-[40px] rounded-full border-2 border-accent px-4 text-sm font-bold text-accent"
          >
            Add a line
          </button>
        </div>
        {extras.map((l, i) => (
          <div key={i} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_120px_44px]">
            <input
              aria-label={`Line ${i + 1} name`}
              value={l.label}
              onChange={(e) =>
                setExtras((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
              className={FIELD}
              placeholder="What it is"
            />
            <input
              aria-label={`Line ${i + 1} description`}
              value={l.detail}
              onChange={(e) =>
                setExtras((p) => p.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))
              }
              className={FIELD}
              placeholder="Short description"
            />
            <input
              aria-label={`Line ${i + 1} amount`}
              value={l.amount}
              inputMode="numeric"
              onChange={(e) =>
                setExtras((p) =>
                  p.map((x, j) =>
                    j === i ? { ...x, amount: e.target.value.replace(/\D/g, "") } : x,
                  ),
                )
              }
              className={FIELD}
              placeholder="KES"
            />
            <button
              type="button"
              aria-label={`Remove line ${i + 1}`}
              onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}
              className="mt-1.5 min-h-[48px] rounded-xl text-sm font-bold text-danger"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pb-terms" className="block text-sm font-semibold text-ink">
            Payment terms
          </label>
          <select
            id="pb-terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value as PaymentTermKey)}
            className={FIELD}
          >
            {Object.entries(PAYMENT_TERMS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pb-weeks" className="block text-sm font-semibold text-ink">
            Delivery (weeks)
          </label>
          <input
            id="pb-weeks"
            type="number"
            min={1}
            max={26}
            value={weeks}
            onChange={(e) => setWeeks(Math.max(1, Math.min(26, Number(e.target.value) || 1)))}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="pb-renewal" className="block text-sm font-semibold text-ink">
            Year-two renewal (KES/year)
          </label>
          <input
            id="pb-renewal"
            value={renewal}
            inputMode="numeric"
            onChange={(e) => setRenewal(e.target.value.replace(/\D/g, ""))}
            className={FIELD}
          />
          <p className="mt-1 text-xs text-muted">0 leaves the renewal paragraph out.</p>
        </div>
        <div>
          <label htmlFor="pb-valid" className="block text-sm font-semibold text-ink">
            Valid for (days)
          </label>
          <input
            id="pb-valid"
            value={validDays}
            inputMode="numeric"
            onChange={(e) => setValidDays(e.target.value.replace(/\D/g, ""))}
            className={FIELD}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="pb-demo" className="block text-sm font-semibold text-ink">
          Demo link <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="pb-demo"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          className={FIELD}
          placeholder="biziirise.com/demos/shop?for=..."
        />
      </div>

      <div className="mt-6 rounded-xl border border-line bg-cream p-4">
        <p className="flex items-baseline justify-between text-base">
          <span className="font-semibold text-ink">Project total</span>
          <span className="text-xl font-extrabold text-ink">
            KES {KES_FMT.format(oneOffTotal)}
          </span>
        </p>
        {monthlyTotal > 0 && (
          <p className="mt-1 flex items-baseline justify-between text-sm text-muted">
            <span>Plus retainer</span>
            <span className="font-bold">KES {KES_FMT.format(monthlyTotal)} / month</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={busy || (!picked.length && !extras.some((e) => e.label.trim()))}
        className="mt-4 min-h-[56px] w-full rounded-full bg-accent text-base font-bold text-cream disabled:bg-line disabled:text-muted"
      >
        {busy ? "Generating…" : "Generate the PDF"}
      </button>
      {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
