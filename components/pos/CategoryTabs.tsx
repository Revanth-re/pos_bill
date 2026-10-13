"use client";

import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
}

export const TOP_TAB = "__top";

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
  showTop = false,
}: {
  categories: CategoryOption[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Show the owner's "Top" items tab first. */
  showTop?: boolean;
}) {
  return (
    <div className="no-select flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x">
      {showTop && (
        <button
          onClick={() => onSelect(TOP_TAB)}
          className={cn(
            "touch-target shrink-0 snap-start rounded-xl px-4 text-sm font-semibold border transition-all duration-150",
            activeId === TOP_TAB
              ? "bg-brand text-white border-brand shadow-sm"
              : "bg-surface text-ink-soft border-border hover:border-brand/40 hover:text-ink"
          )}
        >
          ★ Top
        </button>
      )}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "touch-target shrink-0 snap-start rounded-xl px-4 text-sm font-semibold border transition-all duration-150",
          activeId === null
            ? "bg-brand text-white border-brand shadow-sm"
            : "bg-surface text-ink-soft border-border hover:border-brand/40 hover:text-ink"
        )}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "touch-target shrink-0 snap-start rounded-xl px-4 text-sm font-semibold border transition-all duration-150",
            activeId === c.id
              ? "bg-brand text-white border-brand shadow-sm"
              : "bg-surface text-ink-soft border-border hover:border-brand/40 hover:text-ink"
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
