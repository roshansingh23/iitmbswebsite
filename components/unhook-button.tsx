"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function UnhookButton({ toUserId }: { toUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function unhook() {
    if (busy || done) return;
    setBusy(true);
    const res = await fetch("/api/hooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId })
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={unhook}
      disabled={busy || done}
      aria-label="Unhook"
      className="shrink-0 w-11 h-11 rounded-full border border-hairline bg-white text-ink flex items-center justify-center transition active:scale-95 disabled:opacity-50"
    >
      <X size={18} strokeWidth={2} />
    </button>
  );
}
