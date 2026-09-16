import { PROJECT_STAGES, stageIndex, type ProjectStatus } from "@/lib/portal";

/** The four stages, with everything up to the current one marked done. */
export function StatusTimeline({ status }: { status: ProjectStatus }) {
  const current = stageIndex(status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0">
      {PROJECT_STAGES.map((stage, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={stage.key} className="flex flex-1 items-center gap-3 py-2 sm:flex-col sm:items-start sm:py-0">
            <div className="flex w-full items-center gap-3">
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-mono text-[11px] font-bold ${
                  now
                    ? "border-accent bg-accent text-white"
                    : done
                      ? "border-accent bg-accent-tint text-accent"
                      : "border-line bg-cream text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < PROJECT_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`hidden h-0.5 flex-1 sm:block ${done ? "bg-accent" : "bg-line"}`}
                />
              )}
            </div>
            <span
              className={`text-sm sm:mt-3 ${now ? "font-semibold text-ink" : done ? "text-ink" : "text-muted"}`}
            >
              {stage.label}
              {now && <span className="sr-only"> (current stage)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
