"use client";

import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
}

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: CategoryOption[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "touch-target shrink-0 rounded-full px-4 text-sm font-semibold border transition-colors",
          activeId === null
            ? "bg-ink text-white border-ink"
            : "bg-surface text-ink-soft border-border hover:border-ink/30"
        )}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "touch-target shrink-0 rounded-full px-4 text-sm font-semibold border transition-colors",
            activeId === c.id
              ? "bg-brand text-white border-brand"
              : "bg-surface text-ink-soft border-border hover:border-brand/40"
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
