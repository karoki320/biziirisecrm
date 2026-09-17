"use client";

import { useActionState } from "react";
import Link from "next/link";
import { services } from "@/lib/services";
import { acceptAgreement, type AgreementState } from "@/app/actions/agreements";
import { TERMS_VERSION } from "@/lib/terms";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink " +
  "placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function AgreementForm() {
  const [state, action, pending] = useActionState<AgreementState, FormData>(
    acceptAgreement,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-accent bg-accent-tint px-6 py-8 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-ink">That&rsquo;s it — you&rsquo;re signed.</p>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
          {state.emailed
            ? "Your agreement is on its way to your inbox as a PDF. Nothing to print, nothing to post back."
            : "Your agreement is recorded. We will send your PDF copy shortly."}
        </p>
        <p className="mt-5 inline-block rounded-full bg-cream px-4 py-2 font-mono text-sm font-semibold text-accent">
          {state.reference}
        </p>
        <p className="mt-5 text-sm text-muted">
          Keep that reference. Quote it if you ever need to ask about this agreement.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your full name" name="fullName" autoComplete="name"
          placeholder="Jane Mwihaki" error={state.fieldErrors?.fullName} />
        <Field label="Business name" name="business" autoComplete="organization"
          placeholder="Skinner's Butchery" error={state.fieldErrors?.business} />
        <Field label="Email" name="email" type="email" autoComplete="email"
          placeholder="you@business.co.ke" error={state.fieldErrors?.email} />
        <Field label="Phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          required={false} placeholder="0712 345 678" error={state.fieldErrors?.phone} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="service" className="mb-1.5 block text-sm font-semibold text-ink">
            Service <span className="font-normal text-muted">(optional)</span>
          </label>
          <select id="service" name="service" defaultValue="" className={field}>
            <option value="">Not sure yet</option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>{s.title}</option>
            ))}
          </select>
        </div>
        <Field label="Package" name="pkg" required={false}
          placeholder="e.g. Standard" error={state.fieldErrors?.pkg} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <label htmlFor="accept" className="flex cursor-pointer items-start gap-3.5">
          <input
            id="accept"
            name="accept"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="text-sm leading-relaxed text-ink">
            I have read and accept the{" "}
            <Link href="/terms" className="font-semibold text-accent underline underline-offset-4">
              terms of engagement
            </Link>{" "}
            (version {TERMS_VERSION}), and I am authorised to accept them for this business.
          </span>
        </label>
        {state.fieldErrors?.accept && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {state.fieldErrors.accept}
          </p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white
                   transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Preparing your agreement…" : "Accept and send me the agreement"}
      </button>

      <p className="text-sm leading-relaxed text-muted">
        We email the signed PDF to you and keep a copy. Your acceptance is recorded with the date,
        time and the exact version of the terms you were shown.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required = true,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
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
