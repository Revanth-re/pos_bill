/** Shown instantly while a page loads, so taps feel immediate. */
export default function Loading() {
  return (
    <div className="flex-1 animate-pulse space-y-4 p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 rounded-lg bg-border/70" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-border/50" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-border/40" />
    </div>
  );
}
