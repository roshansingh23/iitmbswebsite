"use client";

import { useState } from "react";

const KINDS: { key: string; emoji: string }[] = [
  { key: "fire",     emoji: "🔥" },
  { key: "real",     emoji: "💯" },
  { key: "samesame", emoji: "🫂" }
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
      {KINDS.map(({ key, emoji }) => (
        <button
          key={key}
          type="button"
          onClick={() => react(key)}
          disabled={busy === key}
          aria-label={key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-hairline rounded-full hover:bg-tint transition active:scale-[0.95]"
        >
          <span className="text-base leading-none">{emoji}</span>
          <span className="text-xs font-semibold tabular-nums">{counts[key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
