import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProject,
  getDocuments,
  PROJECT_STAGES,
  stageIndex,
  kes,
  shortDate,
  fileSize,
} from "@/lib/portal";
import { StatusTimeline } from "@/components/portal/status-timeline";
import { DocumentUploader } from "@/components/portal/document-uploader";

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const documents = await getDocuments(id);
  const stage = PROJECT_STAGES[Math.max(0, stageIndex(project.status))];

  return (
    <>
      <Link href="/portal" className="text-sm font-medium text-muted transition-colors hover:text-ink">
        <span aria-hidden="true">←</span> All projects
      </Link>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        {project.name}
      </h1>
      {project.summary && (
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{project.summary}</p>
      )}

      <section className="mt-9 rounded-card border border-line bg-cream p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Where it stands
          </h2>
          <p className="font-semibold text-accent">{stage.label}</p>
        </div>
        <div className="mt-7">
          <StatusTimeline status={project.status} />
        </div>
      </section>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
        {[
          ["Started", shortDate(project.started_at)],
          ["Delivered", shortDate(project.delivered_at)],
          ["Agreed price", kes(project.price_kes)],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream px-6 py-5">
            <dt className="font-mono text-xs uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-1.5 font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Documents for this project
        </h2>

        <div className="mt-5">
          <DocumentUploader projectId={project.id} />
        </div>

        {documents.length > 0 && (
          <ul className="mt-5 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-cream px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{doc.file_name}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {shortDate(doc.created_at)}
                    {doc.size_bytes ? ` · ${fileSize(doc.size_bytes)}` : ""}
                  </p>
                </div>
                <Link href={`/portal/documents/${doc.id}`} className="shrink-0 text-sm font-semibold text-accent">
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
