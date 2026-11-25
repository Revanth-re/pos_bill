"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

const LABELS = ["", "Poor", "Okay", "Good", "Very good", "Excellent!"];

/** "How do you like Billo?" — stars only, with Not now. Shown after 10 and 20 bills (decided on the server). */
export function RatingPrompt({ milestone }: { milestone: number }) {
  const [open, setOpen] = useState(true);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [thanks, setThanks] = useState(false);

  function send(value: number | null) {
    fetch("/api/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestone, stars: value }),
      keepalive: true,
    }).catch(() => {});
  }

  if (!open) return null;
  const shown = hover || stars;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="rate-title">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        {!thanks && (
          <button
            type="button"
            onClick={() => {
              send(null);
              setOpen(false);
            }}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-paper"
            aria-label="Not now"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {thanks ? (
          <>
            <p className="text-4xl" aria-hidden>🙏</p>
            <h2 className="mt-2 text-xl font-extrabold text-ink">Thank you!</h2>
            <p className="mt-1 text-[15px] text-ink-soft">Your rating helps us make Billo better.</p>
            <button type="button" onClick={() => setOpen(false)} className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white">
              Done
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-brand">🎉 {milestone} bills done with Billo!</p>
            <h2 id="rate-title" className="mt-1 text-xl font-extrabold text-ink">How do you like Billo?</h2>
            <div className="mt-4 flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={stars === n}
                  className="rounded-lg p-1 transition-transform active:scale-90"
                >
                  <Star className={`h-10 w-10 ${n <= shown ? "fill-accent text-accent-dark" : "text-border"}`} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <p className="mt-1 h-5 text-sm font-semibold text-ink-soft">{LABELS[shown]}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  send(null);
                  setOpen(false);
                }}
                className="min-h-12 rounded-xl border border-border text-base font-bold text-ink-soft"
              >
                Not now
              </button>
              <button
                type="button"
                disabled={!stars}
                onClick={() => {
                  send(stars);
                  setThanks(true);
                }}
                className="min-h-12 rounded-xl bg-brand text-base font-bold text-white disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
