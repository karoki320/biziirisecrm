"use client";

import { useActionState, useState } from "react";
import { submitGetStarted, type LeadFormState } from "@/app/actions/get-started";
import { BUSINESS_TYPES, BRANCHES } from "@/lib/lead-form";

/**
 * The ad landing form.
 *
 * Built for one thumb on a phone: single column, 52px controls, 16px text
 * (anything smaller and iOS zooms the page on focus), and chips instead of
 * dropdowns — a native select on Android is a full-screen list and a step
 * backwards. Every answer is one tap except the three that must be typed.
 */

const field =
  "w-full min-h-[52px] rounded-xl border-2 border-line bg-white px-4 py-3 text-base text-ink " +
  "placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

function Chips({
  name,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o)}
              className={`min-h-[48px] rounded-full border-2 px-5 text-base font-semibold transition-colors ${
                on
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-ink active:bg-cream-deep"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-base font-semibold text-ink">{children}</span>;
}

export function GetStartedForm() {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(
    submitGetStarted,
    {},
  );
  /**
   * The text fields are controlled. React 19 resets an uncontrolled form once
   * its action finishes — so a single validation error would wipe everything
   * the person had typed. On a phone, that loses the lead.
   */
  const [text, setText] = useState({
    name: "",
    phone: "",
    businessName: "",
    location: "",
    message: "",
  });
  const set = (k: keyof typeof text) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setText((t) => ({ ...t, [k]: e.target.value }));

  const [type, setType] = useState<string | null>(null);
  const [branches, setBranches] = useState<string | null>(null);
  // Stored exactly as the chip reads and exactly as the server expects —
  // the two drifting apart is how a form fails silently.
  const [online, setOnline] = useState<"Yes" | "No" | null>(null);

  /**
   * Which ad sent them, read from the URL at the moment they submit rather
   * than held in state — the answer can't change while the form is open, and
   * this keeps the render free of an effect that only exists to copy a value.
   */
  function action(data: FormData) {
    const p = new URLSearchParams(window.location.search);
    data.set("utmSource", p.get("utm_source") ?? "");
    data.set("utmCampaign", p.get("utm_campaign") ?? "");
    formAction(data);
  }

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-accent bg-accent-tint px-6 py-10 text-center">
        <span aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl text-white">
          ✓
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          Thanks, {state.name}!
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-lg leading-relaxed text-muted">
          We&rsquo;ll message you on WhatsApp shortly.
        </p>
        <a
          href={state.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-full bg-[#12805c]
                     px-6 text-lg font-bold text-white transition-colors hover:bg-[#0d6448]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.82 14.06c-.24.68-1.22 1.24-1.7 1.28-.44.04-.86.2-2.9-.6-2.44-.96-3.98-3.45-4.1-3.61-.12-.16-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3h.46c.15 0 .35-.06.54.41.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4l-.36.42c-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.18 1.26Z" />
          </svg>
          Chat with us now on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7">
      {/* Honeypot — off screen, never focusable, invisible to a person. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <label className="block">
        <Label>Your name</Label>
        <input
          name="name"
          value={text.name}
          onChange={set("name")}
          required
          autoComplete="name"
          placeholder="e.g. Amina"
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          className={field}
        />
        {state.fieldErrors?.name && (
          <p className="mt-2 text-sm font-semibold text-danger">{state.fieldErrors.name}</p>
        )}
      </label>

      <label className="block">
        <Label>Phone / WhatsApp number</Label>
        <input
          name="phone"
          value={text.phone}
          onChange={set("phone")}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07XX XXX XXX"
          aria-invalid={state.fieldErrors?.phone ? true : undefined}
          className={field}
        />
        {state.fieldErrors?.phone && (
          <p className="mt-2 text-sm font-semibold text-danger">{state.fieldErrors.phone}</p>
        )}
      </label>

      <label className="block">
        <Label>Business name</Label>
        <input
          name="businessName"
          value={text.businessName}
          onChange={set("businessName")}
          required
          autoComplete="organization"
          placeholder="e.g. Baraka Minimart"
          aria-invalid={state.fieldErrors?.businessName ? true : undefined}
          className={field}
        />
        {state.fieldErrors?.businessName && (
          <p className="mt-2 text-sm font-semibold text-danger">{state.fieldErrors.businessName}</p>
        )}
      </label>

      <fieldset>
        <legend className="mb-2 block text-base font-semibold text-ink">Type of business</legend>
        <Chips
          name="businessType"
          options={BUSINESS_TYPES}
          value={type}
          onChange={setType}
          error={state.fieldErrors?.businessType}
        />
      </fieldset>

      <label className="block">
        <Label>Location</Label>
        <input
          name="location"
          value={text.location}
          onChange={set("location")}
          required
          placeholder="e.g. Kasarani, Nairobi"
          aria-invalid={state.fieldErrors?.location ? true : undefined}
          className={field}
        />
        {state.fieldErrors?.location && (
          <p className="mt-2 text-sm font-semibold text-danger">{state.fieldErrors.location}</p>
        )}
      </label>

      <fieldset>
        <legend className="mb-2 block text-base font-semibold text-ink">
          Number of branches
        </legend>
        <Chips name="branches" options={BRANCHES} value={branches} onChange={setBranches} />
      </fieldset>

      <fieldset>
        <legend className="mb-2 block text-base font-semibold text-ink">
          Do you already sell online?
        </legend>
        <Chips
          name="sellsOnline"
          options={["Yes", "No"]}
          value={online}
          onChange={(v) => setOnline(v as "Yes" | "No")}
          error={state.fieldErrors?.sellsOnline}
        />
      </fieldset>

      <label className="block">
        <Label>
          Anything else? <span className="font-normal text-muted">(optional)</span>
        </Label>
        <textarea
          name="message"
          value={text.message}
          onChange={set("message")}
          rows={3}
          placeholder="e.g. I have two tills and want stock tracked"
          className={`${field} resize-none`}
        />
      </label>

      {(state.error || state.fieldErrors?.branches) && (
        <p className="text-sm font-semibold text-danger">
          {state.error ?? state.fieldErrors?.branches}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-accent px-6
                   text-lg font-bold text-white transition-colors hover:bg-accent-hover
                   disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
      >
        {pending ? "Sending…" : "Send my details"}
      </button>

      <p className="text-center text-sm leading-relaxed text-muted">
        We only use your details to get back to you.
      </p>
    </form>
  );
}
