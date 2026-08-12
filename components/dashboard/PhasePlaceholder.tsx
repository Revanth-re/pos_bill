export function PhasePlaceholder({
  title,
  phase,
  description,
  schemaModels,
}: {
  title: string;
  phase: string;
  description: string;
  schemaModels: string[];
}) {
  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-xl font-extrabold text-ink">{title}</h1>
      <div className="mt-4 border-2 border-dashed border-border bg-surface p-6">
        <span className="inline-block rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-ink-soft">
          {phase}
        </span>
        <p className="mt-3 text-sm text-ink-soft">{description}</p>
        <p className="mt-3 text-xs text-muted">
          Schema is ready: <code className="rounded bg-paper px-1">{schemaModels.join(", ")}</code>. This
          screen needs its API routes + UI built against those models.
        </p>
      </div>
    </div>
  );
}
