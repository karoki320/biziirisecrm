import Link from "next/link";
import type { Metadata } from "next";
import { getDocuments, fileSize, shortDate } from "@/lib/portal";
import { DocumentUploader } from "@/components/portal/document-uploader";

export const metadata: Metadata = {
  title: "Documents",
  robots: { index: false, follow: false },
};

export default async function DocumentsPage() {
  const documents = await getDocuments();

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Documents
      </h1>
      <p className="mt-2 leading-relaxed text-muted">
        Everything you have sent us, and everything we have sent you. No more
        scrolling back through WhatsApp for a logo file.
      </p>

      <div className="mt-8">
        <DocumentUploader />
      </div>

      <section className="mt-10">
        {documents.length === 0 ? (
          <p className="rounded-card border border-line bg-cream-deep px-6 py-8 leading-relaxed text-muted">
            Nothing here yet. Anything you upload above will appear in this list.
          </p>
        ) : (
          <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-cream px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{doc.file_name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {shortDate(doc.created_at)}
                    {doc.size_bytes ? ` · ${fileSize(doc.size_bytes)}` : ""}
                  </p>
                </div>
                <Link
                  href={`/portal/documents/${doc.id}`}
                  className="shrink-0 text-sm font-semibold text-accent"
                >
                  Download
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
