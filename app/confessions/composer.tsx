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
    if (!body.trim() || sending) return;
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
    <div className="mt-4 card-line p-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Share a tea…"
        className="border-0 p-0 focus:outline-none"
      />
      <div className="mt-2 flex justify-end">
        <Button onClick={submit} disabled={sending || !body.trim()}>
          {sending ? "Pouring…" : "Spill"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-ink">{error}</p>}
    </div>
  );
}
