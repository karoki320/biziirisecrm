"use client";

import { useActionState } from "react";
import { acceptWhatsAppInvite, type JoinState } from "@/app/actions/whatsapp-invite";
import { PasswordInput } from "@/components/auth/password-input";

export function JoinForm({ token, phone }: { token: string; phone: string }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(acceptWhatsAppInvite, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      {/* Lets the phone's password manager save the login against the number. */}
      <input type="hidden" name="username" autoComplete="username" value={phone} readOnly />

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-ink">
          Choose a password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-semibold text-ink">
          Type it again
        </label>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          invalid={Boolean(state.fieldErrors?.confirm)}
        />
        {state.fieldErrors?.confirm && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{state.fieldErrors.confirm}</p>
        )}
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-line bg-cream-deep px-4 py-3 text-sm leading-relaxed text-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Save password and go in"}
      </button>
    </form>
  );
}
