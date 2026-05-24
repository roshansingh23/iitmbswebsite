"use client";

import { useState } from "react";
import { X as XIcon, Heart as HeartIcon } from "lucide-react";
import { ProfileCard, type Candidate } from "./profile-card";

export function DiscoverDeck({ candidates }: { candidates: Candidate[] }) {
  const [idx, setIdx] = useState(0);

  const current = candidates[idx];

  // Fire-and-forget. Deck advances on tap, server uses onConflict-do-nothing
  // so duplicate submits are harmless. No await => button feels instant.
  function pass() {
    if (!current) return;
    const id = current.id;
    setIdx((i) => i + 1);
    fetch("/api/passes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: id })
    }).catch(() => {});
  }

  function hook() {
    if (!current) return;
    const id = current.id;
    setIdx((i) => i + 1);
    fetch("/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId: id,
        targetType: "profile",
        targetId: null,
        note: null,
        isHardHook: false
      })
    }).catch(() => {});
  }

  if (!current) {
    return (
      <div className="card-line p-6 mx-4">
        <p className="font-semibold text-lg">That's everyone for now.</p>
        <p className="mt-2 text-muted text-sm">
          We'll refresh the deck soon. Come back in a bit.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4">
        <ProfileCard candidate={current} onRemove={pass} />
      </div>

      <div
        className="fixed inset-x-0 z-40 pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px + 12px)" }}
      >
        <div className="mx-auto max-w-md flex items-center justify-between px-6">
          <button
            type="button"
            onClick={pass}
            aria-label="Pass"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-hairline flex items-center justify-center transition-transform duration-100 active:scale-90"
            style={{
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <XIcon size={26} strokeWidth={2.25} className="text-ink" />
          </button>
          <button
            type="button"
            onClick={hook}
            aria-label="Hook"
            className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-hairline flex items-center justify-center transition-transform duration-100 active:scale-90"
            style={{
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            <HeartIcon size={26} strokeWidth={2} className="text-ink" />
          </button>
        </div>
      </div>
    </>
  );
}
