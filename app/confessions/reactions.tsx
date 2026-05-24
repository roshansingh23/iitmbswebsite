"use client";

import { useState } from "react";

// Hand-drawn icons — flame for "fire" (hot take), double-quote for "real"
// (true that), Venn-overlap for "samesame" (relatable). Monochrome strokes
// at 1.5, no stock-icon set.

function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 C 11 7 8 9 8 13 C 8 16.5 9.8 19 12 19 C 14.2 19 16 16.5 16 13.5 C 16 11.5 14.8 9.5 13 8 C 13.4 11 12.7 12.5 12 12.5 C 11.2 12.5 11 11 12 3 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QuoteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6 L 6 11.5 Q 6 14 4 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 6 L 14 11.5 Q 14 14 12 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function VennIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const KINDS: { key: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { key: "fire", Icon: FlameIcon },
  { key: "real", Icon: QuoteIcon },
  { key: "samesame", Icon: VennIcon }
];

export function ConfessionReactions({
  confessionId,
  initial
}: {
  confessionId: string;
  initial: Record<string, number>;
}) {
  const [counts, setCounts] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function react(kind: string) {
    setBusy(kind);
    const res = await fetch(`/api/confessions/${confessionId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind })
    });
    if (res.ok) {
      const data = await res.json();
      setCounts(data.counts);
    }
    setBusy(null);
  }

  return (
    <div className="flex items-center gap-2">
      {KINDS.map(({ key, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => react(key)}
          disabled={busy === key}
          aria-label={key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hairline rounded-full hover:bg-tint transition active:scale-[0.95]"
        >
          <Icon size={16} />
          <span className="text-xs font-semibold tabular-nums">{counts[key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
