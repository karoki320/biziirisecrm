"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signAgreementInPortal, type SignState } from "@/app/actions/signatures";
import { SignaturePad } from "@/components/portal/signature-pad";

const field =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-ink " +
  "placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function SignAgreementForm({
  requestId,
  defaultName,
  business,
}: {
  requestId: string;
  defaultName: string;
  business: string;
}) {
  const [state, action, pending] = useActionState<SignState, FormData>(signAgreementInPortal, {});

  if (state.ok) {
    return (
      <div className="rounded-2xl border-2 border-accent bg-accent-tint px-6 py-8 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-ink">Signed. Thank you.</p>
        <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">
          Your signature is now on the agreement.
          {state.emailed ? " We've emailed you a copy as well." : ""}
        </p>
        <p className="mt-5 inline-block rounded-full bg-cream px-4 py-2 font-mono text-sm font-semibold text-accent">
          {state.reference}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {state.documentId && (
            <a
              href={`/portal/documents/${state.documentId}`}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Download signed copy
            </a>
          )}
          <Link
            href="/portal"
            className="rounded-full border border-line bg-cream px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent"
          >
            Back to your portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="requestId" value={requestId} />

      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-ink">
          Your full name
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={defaultName}
          required
          className={field}
          aria-invalid={state.fieldErrors?.fullName ? true : undefined}
        />
        {state.fieldErrors?.fullName && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.fullName}</p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink">Your signature</p>
        <SignaturePad invalid={Boolean(state.fieldErrors?.signature)} />
        {state.fieldErrors?.signature && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.signature}</p>
        )}
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
            I have read this agreement and I sign it on behalf of{" "}
            <span className="font-semibold">{business}</span>. I understand this
            electronic signature has the same effect as signing on paper.
          </span>
        </label>
        {state.fieldErrors?.accept && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">{state.fieldErrors.accept}</p>
        )}
      </div>

      {(state.error || state.fieldErrors?.requestId) && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error ?? state.fieldErrors?.requestId}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Signing…" : "Sign the agreement"}
      </button>
    </form>
  );
}
