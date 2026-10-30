"use client";

import { useState } from "react";

/** A password field with a Show / Hide button, so people can check what they typed. */
export function PasswordInput({
  id,
  name,
  autoComplete = "current-password",
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-2">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className="w-full rounded-xl border border-line bg-cream py-3 pl-4 pr-20 text-ink outline-none transition-colors focus:border-accent"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-pressed={show}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
