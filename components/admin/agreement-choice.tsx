"use client";

import { useState } from "react";

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

/**
 * Which agreement the client signs: our standard terms, or the custom PDF
 * drawn up for this project. Sits inside an admin form; every input here
 * travels with that form.
 */
export function AgreementChoice({
  services,
  projects,
}: {
  services: string[];
  projects: { id: string; name: string }[];
}) {
  const [kind, setKind] = useState<"standard" | "custom">("standard");

  const option = (value: "standard" | "custom", label: string, hint: string) => (
    <label
      className={`flex flex-1 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
        kind === value ? "border-accent bg-accent-tint" : "border-line bg-cream"
      }`}
    >
      <input
        type="radio"
        name="agreementKind"
        value={value}
        checked={kind === value}
        onChange={() => setKind(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold text-muted">Which agreement?</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {option("standard", "Standard agreement", "Our terms, filled in with their details")}
        {option("custom", "Custom agreement", "Upload the PDF made for this project")}
      </div>

      {kind === "custom" && (
        <div className="grid gap-3 rounded-xl border border-dashed border-accent/50 p-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Agreement PDF (max 4MB)</span>
            <input
              type="file"
              name="agreementFile"
              accept="application/pdf,.pdf"
              required
              className="block w-full text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <input
            name="agreementTitle"
            placeholder="Title, e.g. Website build agreement (optional)"
            className={`${field} sm:col-span-2`}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.length > 0 && (
          <select name="projectId" defaultValue="" className={`${field} sm:col-span-2`} aria-label="Project">
            <option value="">For which project? (optional)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {kind === "standard" && (
          <>
            <select name="service" defaultValue="" className={field} aria-label="Service">
              <option value="">Service (optional)</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input name="pkg" placeholder="Package, e.g. Standard (optional)" className={field} />
          </>
        )}
      </div>
    </div>
  );
}
