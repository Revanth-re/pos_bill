"use client";

/** Friendly screen instead of the blank "This page couldn't load". */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg font-bold text-ink">Couldn&apos;t load this page</p>
      <p className="text-sm text-muted">Usually the server couldn&apos;t reach the database. Try again, or log in again.</p>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white">Try again</button>
        <a href="/api/session-reset" className="rounded-xl border border-border px-4 py-2.5 font-semibold text-ink">Log in again</a>
      </div>
      <a href="/api/where" className="text-xs text-brand underline">Check server status</a>
      {error.digest && <p className="text-[11px] text-muted">Error code: {error.digest}</p>}
    </div>
  );
}
