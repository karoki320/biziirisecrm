"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { services, priceLabel, type Service, type Pkg } from "@/lib/services";
import { submitInquiry, type InquiryState } from "@/app/actions/inquiries";

/**
 * The service finder.
 *
 * Premise, in Eugene's words: Kenyans don't read. So instead of asking someone
 * to scroll a homepage and work out which of four services they need, we ask
 * one question in the words they'd use themselves, and take them the rest of
 * the way. Search -> pick -> read -> enquire -> WhatsApp, without leaving the
 * page they landed on.
 *
 * The lead is captured before the WhatsApp handoff, so someone who fills the
 * form and then wanders off is still in the CRM.
 */

type Screen = "browse" | "service" | "form";

const field =
  "w-full rounded-xl border border-line bg-cream-deep px-4 py-3.5 text-base text-ink " +
  "placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function BackGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function score(service: Service, q: string): number {
  if (!q) return 1;
  const needle = q.toLowerCase().trim();
  if (service.title.toLowerCase().includes(needle)) return 3;
  if (service.keywords.some((k) => k.startsWith(needle))) return 2;
  if (service.keywords.some((k) => k.includes(needle))) return 1.5;
  if (service.cardBlurb.toLowerCase().includes(needle)) return 1;
  return 0;
}

export function ServiceFinder() {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("browse");
  const [query, setQuery] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [pkg, setPkg] = useState<Pkg | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () =>
      services
        .map((s) => ({ s, n: score(s, query) }))
        .filter((r) => r.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((r) => r.s),
    [query],
  );

  // Close on Escape, and don't let the page scroll behind the dialogue.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open && screen === "browse") searchRef.current?.focus();
  }, [open, screen]);

  function start() {
    setScreen("browse");
    setService(null);
    setPkg(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      {/* ---------------------------- the trigger ---------------------------- */}
      <button
        type="button"
        onClick={start}
        data-cta="service-finder"
        className="group flex w-full items-center gap-3 rounded-full border-2 border-line bg-surface px-5 py-4
                   text-left transition-colors hover:border-accent/50 focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-accent/40 sm:max-w-md"
      >
        <SearchGlyph className="h-5 w-5 shrink-0 text-accent" />
        <span className="text-base text-muted group-hover:text-ink sm:text-lg">
          What are you looking for?
        </span>
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Find the service you need"
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl
                       border border-line bg-cream shadow-2xl sm:rounded-3xl"
          >
            {/* ------------------------------ header ------------------------------ */}
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              {screen !== "browse" && (
                <button
                  type="button"
                  onClick={() => setScreen(screen === "form" ? "service" : "browse")}
                  aria-label="Back"
                  className="-ml-2 rounded-full p-2 text-muted hover:bg-cream-deep hover:text-ink"
                >
                  <BackGlyph className="h-5 w-5" />
                </button>
              )}
              <p className="flex-1 text-sm font-semibold text-ink">
                {screen === "browse" && "What do you need?"}
                {screen === "service" && service?.title}
                {screen === "form" && "Almost there"}
              </p>
              <button
                type="button"
                onClick={close}
                className="-mr-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-cream-deep hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {screen === "browse" && (
                <BrowseScreen
                  query={query}
                  setQuery={setQuery}
                  matches={matches}
                  searchRef={searchRef}
                  onPick={(s) => {
                    setService(s);
                    setPkg(null);
                    setScreen("service");
                  }}
                />
              )}

              {screen === "service" && service && (
                <ServiceScreen
                  service={service}
                  pkg={pkg}
                  setPkg={setPkg}
                />
              )}

              {screen === "form" && service && (
                <InquiryForm service={service} pkg={pkg} />
              )}
            </div>

            {/* Action bar. Outside the scroller on purpose: sticky-inside lets
                long content sit visibly below the button, which reads as a
                layout bug. */}
            {screen === "service" && service && (
              <div className="border-t border-line bg-cream px-5 pb-5 pt-4">
                <button
                  type="button"
                  onClick={() => setScreen("form")}
                  className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white
                             transition-colors hover:bg-accent-hover focus:outline-none
                             focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {pkg ? `Ask about ${pkg.name}` : `Ask about ${service.title.toLowerCase()}`}
                </button>
                <Link
                  href={`/services/${service.slug}`}
                  className="mt-3 block py-1 text-center text-sm font-medium text-muted underline underline-offset-4 hover:text-ink"
                >
                  Read the full page first
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------ screen 1 ------------------------------ */

function BrowseScreen({
  query,
  setQuery,
  matches,
  searchRef,
  onPick,
}: {
  query: string;
  setQuery: (v: string) => void;
  matches: Service[];
  searchRef: React.RefObject<HTMLInputElement | null>;
  onPick: (s: Service) => void;
}) {
  return (
    <div>
      <div className="relative">
        <SearchGlyph className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="A website, an online shop, social media…"
          aria-label="Search services"
          className={`${field} pl-12`}
        />
      </div>

      <ul className="mt-4 space-y-2.5">
        {matches.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-left
                         transition-colors hover:border-accent hover:bg-accent-tint/40
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-bold text-ink">{s.title}</span>
                <span className="shrink-0 text-xs font-semibold text-accent">{s.priceHint}</span>
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-muted">{s.cardBlurb}</span>
            </button>
          </li>
        ))}
      </ul>

      {matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
          <p className="font-semibold text-ink">We might still build that.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Nothing matched &ldquo;{query}&rdquo;, but custom work is most of what we do.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 text-sm font-semibold text-accent underline underline-offset-4"
          >
            See everything
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ screen 2 ------------------------------ */

function ServiceScreen({
  service,
  pkg,
  setPkg,
}: {
  service: Service;
  pkg: Pkg | null;
  setPkg: (p: Pkg | null) => void;
}) {
  return (
    <div>
      <p className="text-base font-semibold leading-snug text-ink">{service.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{service.intro}</p>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">
        Pick what fits
      </p>

      <ul className="mt-3 space-y-2.5">
        {service.packages.map((p) => {
          const selected = pkg?.name === p.name;
          return (
            <li key={p.name}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setPkg(selected ? null : p)}
                className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    selected
                      ? "border-accent bg-accent-tint"
                      : "border-line bg-surface hover:border-accent/50"
                  }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-ink">{p.name}</span>
                  <span className="shrink-0 text-sm font-bold text-accent">{priceLabel(p)}</span>
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted">{p.summary}</span>
                {selected && p.features.length > 0 && (
                  <span className="mt-3 block space-y-1.5 border-t border-accent/25 pt-3">
                    {p.features.map((f) => (
                      <span key={f} className="flex gap-2 text-sm leading-relaxed text-ink">
                        <span aria-hidden="true" className="text-accent">✓</span>
                        <span>{f}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {service.packagesNote && (
        <p className="mt-4 text-xs leading-relaxed text-muted">{service.packagesNote}</p>
      )}

    </div>
  );
}

/* ------------------------------ screen 3 ------------------------------ */

function InquiryForm({ service, pkg }: { service: Service; pkg: Pkg | null }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    submitInquiry,
    {},
  );

  // On success the server hands back the WhatsApp URL it built. Go there.
  useEffect(() => {
    if (state.whatsappUrl) window.location.href = state.whatsappUrl;
  }, [state.whatsappUrl]);

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Four quick things, then WhatsApp opens with your message already written.
      </p>

      <input type="hidden" name="service" value={service.title} />
      {pkg && <input type="hidden" name="pkg" value={pkg.name} />}

      {/* Honeypot: off-screen, never focusable, invisible to a person. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Field label="Your name" name="name" error={state.fieldErrors?.name}
        autoComplete="name" placeholder="Eugene Karoki" />
      <Field label="Business name" name="business" error={state.fieldErrors?.business}
        autoComplete="organization" placeholder="Skinner's Butchery" />
      <Field label="Phone number" name="phone" error={state.fieldErrors?.phone}
        type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" />

      <div>
        <label htmlFor="need" className="mb-1.5 block text-sm font-semibold text-ink">
          What do you need?{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="need"
          name="need"
          rows={3}
          placeholder="A shop for my perfumes, about 40 products, M-Pesa checkout."
          className={`${field} resize-none`}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white
                   transition-colors hover:bg-accent-hover disabled:opacity-60
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {pending ? "One moment…" : "Continue on WhatsApp"}
      </button>

      <p className="text-center text-xs leading-relaxed text-muted">
        We only use this to reply to you. Nothing else, ever.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={field}
        {...rest}
      />
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
