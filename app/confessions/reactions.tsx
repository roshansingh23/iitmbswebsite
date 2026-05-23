"use client";

import { useState } from "react";

const KINDS: { key: string; label: string }[] = [
  { key: "fire", label: "fire" },
  { key: "real", label: "real" },
  { key: "samesame", label: "same" }
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
    <div className="flex items-center gap-2 text-xs">
      {KINDS.map((k) => (
        <button
          key={k.key}
          onClick={() => react(k.key)}
          disabled={busy === k.key}
          className="px-3 py-1 border border-hairline rounded-full hover:bg-tint transition"
        >
          {k.label} <span className="text-muted ml-1">{counts[k.key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
