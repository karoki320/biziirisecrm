"use client";

import { useActionState, useRef } from "react";
import { uploadDocument, type UploadState } from "@/app/actions/documents";

const initial: UploadState = {};

export function DocumentUploader({ projectId }: { projectId?: string }) {
  const [state, action, pending] = useActionState(uploadDocument, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="rounded-card border border-line bg-cream-deep p-6">
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <h2 className="font-bold text-ink">Send us a document</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Logos, KRA certificates, product lists, anything we have asked for.
        PDFs, images, Word, Excel or CSV, up to 20 MB.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="file"
          required
          className="max-w-full flex-1 text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-hover"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border-2 border-accent px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm leading-relaxed text-ink">
          {state.error}
        </p>
      )}
      {state.uploaded && (
        <p role="status" className="mt-4 text-sm leading-relaxed text-accent">
          {state.uploaded} uploaded. We can see it now.
        </p>
      )}
    </form>
  );
}
