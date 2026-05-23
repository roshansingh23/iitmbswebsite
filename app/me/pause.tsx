"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PauseToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/me/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !on })
    });
    if (res.ok) {
      setOn((v) => !v);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className={
        "relative inline-flex h-7 w-12 rounded-full border border-hairline transition " +
        (on ? "bg-ink" : "bg-card")
      }
    >
      <span
        className={
          "absolute top-[2px] h-5 w-5 rounded-full transition-all " +
          (on ? "left-[22px] bg-bone" : "left-[2px] bg-ink")
        }
      />
    </button>
  );
}
