"use client";

import { useEffect, useState } from "react";
import { SignaturePad } from "@/components/portal/signature-pad";
import { guideEvent } from "@/components/guide/portal-guide";

/**
 * Practice mode: the portal with made-up data. Everything happens in the
 * browser — nothing is sent or saved — so a nervous first-timer can try
 * opening an invoice and signing an agreement without consequences.
 */
type Tab = "overview" | "documents" | "invoices" | "sign";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "invoices", label: "Invoices" },
  { key: "sign", label: "Sign" },
];

export function PracticePortal({ timeline }: { timeline: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replaying the tour starts practice from the top.
  useEffect(() => {
    const reset = (e: Event) => {
      if ((e as CustomEvent).detail === "practice") {
        setTab("overview");
        setSigned(false);
        setError(null);
      }
    };
    window.addEventListener("guide:start", reset);
    return () => window.removeEventListener("guide:start", reset);
  }, []);

  const pick = (t: Tab) => {
    setTab(t);
    guideEvent(`practice:tab:${t}`);
  };

  const fakeSign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!fd.get("signature")) return setError("Draw your signature in the box first.");
    if (!fd.get("accept")) return setError("Tick the box to say you agree.");
    setError(null);
    setSigned(true);
    guideEvent("practice:signed");
  };

  return (
    <>
      <div className="rounded-card border-2 border-dashed border-accent/50 bg-accent-tint px-4 py-3 text-sm leading-relaxed text-ink">
        <span className="font-bold">Practice mode.</span> Sample data only — nothing you do here is
        sent, saved or real.
      </div>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Hello, Practice</h1>
      <p className="mt-2 leading-relaxed text-muted">This is how your portal will look once work begins.</p>

      <div role="tablist" className="mt-6 grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            data-guide={`practice-tab-${t.key}`}
            onClick={() => pick(t.key)}
            className={`whitespace-nowrap rounded-full px-1.5 py-2.5 text-xs font-semibold min-[380px]:text-[13px] transition-colors sm:px-4 sm:text-sm ${
              tab === t.key ? "bg-accent text-white" : "border border-line bg-cream text-ink hover:border-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <div data-guide="practice-project" className="rounded-card border border-line bg-cream p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">Sample online shop</h2>
              <span className="font-mono text-xs text-muted">In progress</span>
            </div>
            <p className="mt-2 leading-relaxed text-muted">A website where customers order and pay by M-Pesa.</p>
            <div className="mt-6">{timeline}</div>
          </div>
        )}

        {tab === "documents" && (
          <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {[
              ["Signed agreement BZR-SAMPLE.pdf", "22 KB"],
              ["Homepage design.png", "840 KB"],
              ["Your logo.svg", "12 KB"],
            ].map(([n, size]) => (
              <li key={n} className="flex items-center justify-between gap-4 bg-cream px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{n}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">sample · {size}</p>
                </div>
                <span className="text-sm font-semibold text-accent">Download</span>
              </li>
            ))}
          </ul>
        )}

        {tab === "invoices" && (
          <div data-guide="practice-invoice" className="rounded-card border border-line bg-cream px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-ink">INV-SAMPLE-001</p>
                  <span className="rounded-full border border-line bg-cream-deep px-3 py-0.5 font-mono text-[11px] text-ink">
                    Awaiting payment
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted">Online shop — 50% deposit</p>
                <p className="mt-1.5 font-mono text-xs text-muted">Due in 7 days</p>
              </div>
              <p className="font-mono text-lg font-bold text-accent">KES 25,000</p>
            </div>
          </div>
        )}

        {tab === "sign" &&
          (signed ? (
            <div className="rounded-2xl border-2 border-accent bg-accent-tint px-6 py-8 text-center">
              <p className="text-2xl font-extrabold tracking-tight text-ink">Signed — well done!</p>
              <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
                In the real portal your signature would now be on the agreement and saved in Documents.
                This was practice, so nothing was sent.
              </p>
              <button
                type="button"
                onClick={() => setSigned(false)}
                className="mt-5 rounded-full border border-line bg-cream px-5 py-2.5 text-sm font-semibold text-ink"
              >
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={fakeSign} data-guide="practice-sign" className="space-y-5 rounded-card border border-line bg-cream p-5">
              <p className="text-sm leading-relaxed text-muted">
                <span className="font-semibold text-ink">Sample agreement.</span> In the real portal you would
                read your agreement above this box first.
              </p>
              <SignaturePad />
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="accept" className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]" />
                <span className="text-sm leading-relaxed text-ink">I agree (practice — nothing is signed for real).</span>
              </label>
              {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
              <button type="submit" className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white sm:w-auto sm:px-10">
                Sign
              </button>
            </form>
          ))}
      </div>
    </>
  );
}
