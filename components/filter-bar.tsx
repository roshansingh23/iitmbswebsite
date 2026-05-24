"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";

const CHIPS = ["Age", "Distance", "Intentions", "Height"];

// Discover-page filter row. Currently visual placeholders (the underlying
// filter logic isn't wired yet); tapping is a no-op.
export function FilterBar() {
  return (
    <div className="flex items-center gap-2 px-4 pt-2 pb-3 overflow-x-auto no-scrollbar">
      <button
        type="button"
        aria-label="Filters"
        className="shrink-0 w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-ink"
      >
        <SlidersHorizontal size={18} strokeWidth={2} />
      </button>
      {CHIPS.map((c) => (
        <button
          key={c}
          type="button"
          className="shrink-0 flex items-center gap-1 pl-4 pr-2.5 py-2 rounded-full border border-ink text-[0.85rem] font-medium"
        >
          {c}
          <ChevronDown size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
