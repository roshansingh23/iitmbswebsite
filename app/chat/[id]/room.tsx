"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Msg = { id: string; body: string; fromUserId: string; createdAt: string };

export function ChatRoom({
  conversationId,
  meId,
  otherName,
  initialMessages
}: {
  conversationId: string;
  meId: string;
  otherName: string;
  initialMessages: Msg[];
  // Kept in the props for backwards-compat but unused now that the timer UI
  // and lock are off.
  initialLocked?: boolean;
  initialInteractionSeconds?: number;
  capSeconds?: number;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  // Heartbeat — still pings so the server can record activity for both sides,
  // even though we're not showing a timer to the user.
  useEffect(() => {
    let cancelled = false;
    async function ping() {
      if (document.visibilityState !== "visible") return;
      try { await fetch(`/api/chat/${conversationId}/heartbeat`, { method: "POST" }); } catch {}
    }
    ping();
    const t = setInterval(ping, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [conversationId]);

  // Realtime via Supabase broadcast channel. Falls back to polling if no
  // Supabase env is configured.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      let stopped = false;
      async function poll() {
        if (stopped) return;
        if (document.visibilityState === "visible") {
          const last = msgs[msgs.length - 1]?.id ?? "";
          const res = await fetch(`/api/chat/${conversationId}/messages?after=${last}`);
          if (res.ok) {
            const data = await res.json();
            if (data.messages?.length) setMsgs((m) => [...m, ...data.messages]);
          }
        }
        setTimeout(poll, 4000);
      }
      poll();
      return () => { stopped = true; };
    }

    const channel = sb.channel(`conv:${conversationId}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "message" }, (payload) => {
      const m = payload.payload as Msg;
      setMsgs((prev) => prev.some((p) => p.id === m.id) ? prev : [...prev, m]);
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [conversationId, msgs]);

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() })
      });
      if (!res.ok) return;
      const data = await res.json();
      setMsgs((m) => [...m, data.message]);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-6">
      {/* Quiet upgrade CTA — never a paywall, just a way to support the app. */}
      <div className="flex items-center justify-end">
        <Link href="/upgrade" className="btn-line">Upgrade</Link>
      </div>

      <div ref={scroller} className="mt-6 space-y-3 h-[58vh] overflow-y-auto pr-1">
        {msgs.length === 0 && (
          <div className="card-line p-7">
            <p className="serif italic text-2xl">Break the ice.</p>
            <p className="mt-3 text-muted text-sm">
              Ask {otherName} about an answer that hooked you.
            </p>
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={m.fromUserId === meId ? "flex justify-end" : "flex justify-start"}>
            <div className={
              "max-w-[78%] px-4 py-3 rounded-[6px] text-[0.95rem] leading-relaxed " +
              (m.fromUserId === meId
                ? "bg-ink text-bone"
                : "bg-card border border-hairline text-ink")
            }>
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end gap-3 border-t border-hairline pt-6">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Say something."
          className="field min-h-[3rem]"
          rows={2}
          maxLength={1000}
        />
        <Button onClick={send} disabled={sending || !body.trim()}>Send</Button>
      </div>
    </div>
  );
}
