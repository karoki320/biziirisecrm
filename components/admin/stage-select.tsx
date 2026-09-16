"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/admin";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/** A select that submits itself. Cheaper than drag-and-drop and works on a phone. */
export function StageSelect({
  action,
  id,
  current,
  options,
  extra,
  label,
}: {
  action: Action;
  id: string;
  current: string;
  options: { key: string; label: string }[];
  extra?: Record<string, string>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {extra &&
        Object.entries(extra).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <label className="sr-only" htmlFor={`stage-${id}`}>
        {label}
      </label>
      <select
        id={`stage-${id}`}
        name="status"
        defaultValue={current}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-full border border-line bg-cream px-3 py-1.5 font-mono text-[11px] text-ink outline-none transition-colors focus:border-accent disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      {state.error && <span className="text-xs text-ink">{state.error}</span>}
    </form>
  );
}
