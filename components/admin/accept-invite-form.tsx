"use client";

import { useActionState } from "react";
import { acceptInvite, type AcceptState } from "@/app/actions/team";

export function AcceptInviteForm({
  token,
  roleLabel,
}: {
  token: string;
  roleLabel: string;
}) {
  const [state, action, pending] = useActionState(acceptInvite, {} as AcceptState);

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-[56px] w-full rounded-full bg-accent text-base font-bold text-cream disabled:bg-line disabled:text-muted"
      >
        {pending ? "Setting up…" : `Accept and sign in as ${roleLabel}`}
      </button>
      {state.error && (
        <p className="mt-3 text-sm font-medium text-danger">{state.error}</p>
      )}
    </form>
  );
}
