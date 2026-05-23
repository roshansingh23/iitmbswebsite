"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function ConfessionComposer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/confessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() })
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't post.");
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <div className="mt-8 card-line p-6">
      <p className="eyebrow">Drop something anonymous</p>
      <Textarea
        className="mt-3"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        placeholder="Say what you'd never say with your name on it. 500 chars."
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">{body.length} / 500</span>
        <Button onClick={submit} disabled={sending || !body.trim()}>Post</Button>
      </div>
      {error && <p className="mt-3 text-sm text-ink border-l border-ink pl-3">{error}</p>}
    </div>
  );
}
