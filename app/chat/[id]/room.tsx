"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, BadgeCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ChatMenu } from "@/components/chat-menu";

type Msg = { id: string; body: string; fromUserId: string; createdAt: string };

export function ChatRoom({
  conversationId,
  meId,
  otherUserId,
  otherName,
  otherVerified,
  icebreaker,
  initialMessages,
  initialLocked
}: {
  conversationId: string;
  meId: string;
  otherUserId: string;
  otherName: string;
  otherVerified: boolean;
  icebreaker: { question: string; answer: string } | null;
  initialMessages: Msg[];
  initialLocked: boolean;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [locked, setLocked] = useState(initialLocked);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  // Activity heartbeat (silent — no timer UI).
  useEffect(() => {
    function ping() {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/chat/${conversationId}/heartbeat`, { method: "POST" }).catch(() => {});
    }
    ping();
    const t = setInterval(ping, 30_000);
    return () => clearInterval(t);
  }, [conversationId]);

  // Realtime via Supabase broadcast, with polling fallback.
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
      setMsgs((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [conversationId, msgs]);

  async function send(text?: string) {
    const payload = (text ?? body).trim();
    if (!payload || sending || locked) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: payload })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.locked) setLocked(true);
        return;
      }
      const data = await res.json();
      setMsgs((m) => [...m, data.message]);
      if (!text) setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Fixed top — name + 3-dot menu */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-hairline">
        <div className="mx-auto max-w-md h-14 px-3 flex items-center gap-2">
          <Link href="/matches" aria-label="Back" className="p-2 -ml-2 text-ink">
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <h1 className="font-extrabold text-lg tracking-[-0.02em] truncate">{otherName}</h1>
            {otherVerified && (
              <BadgeCheck
                size={18}
                strokeWidth={2}
                style={{ color: "#D43A2F", fill: "transparent" }}
                aria-label="Verified"
              />
            )}
          </div>
          <ChatMenu otherUserId={otherUserId} otherName={otherName} />
        </div>
      </header>

      {/* Scrollable messages */}
      <div
        ref={scroller}
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: "56px", paddingBottom: "80px" }}
      >
        <div className="mx-auto max-w-md px-4 py-4 space-y-3">
          {msgs.length === 0 && icebreaker && (
            <Icebreaker
              question={icebreaker.question}
              answer={icebreaker.answer}
              onPick={() => send(`About "${icebreaker.question}" — `)}
            />
          )}

          {msgs.map((m) => (
            <div key={m.id} className={m.fromUserId === meId ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[78%] px-4 py-2.5 text-[0.95rem] leading-relaxed " +
                  (m.fromUserId === meId
                    ? "bg-ink text-white rounded-[18px] rounded-br-[6px]"
                    : "bg-tint text-ink rounded-[18px] rounded-bl-[6px]")
                }
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed bottom — either input or, when locked, upgrade CTA */}
      <div
        className="fixed inset-x-0 z-40"
        style={{ bottom: 0, paddingBottom: "env(safe-area-inset-bottom)", background: "white" }}
      >
        <div className="mx-auto max-w-md border-t border-hairline">
          {locked ? (
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm leading-snug">
                This chat is paused.<br />
                Upgrade to keep talking.
              </p>
              <Link
                href="/upgrade"
                className="shrink-0 px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold"
              >
                Upgrade
              </Link>
            </div>
          ) : (
            <div className="px-3 py-2 flex items-end gap-2">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Message"
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none border border-hairline rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={sending || !body.trim()}
                aria-label="Send"
                className="shrink-0 w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Icebreaker({
  question, answer, onPick
}: { question: string; answer: string; onPick: () => void }) {
  return (
    <article className="card-line p-5">
      <p className="text-xs text-muted uppercase tracking-[0.18em] font-semibold">
        Icebreaker
      </p>
      <p className="mt-3 text-sm text-muted">{question}</p>
      <p className="mt-2 font-semibold text-lg leading-snug">"{answer}"</p>
      <button
        type="button"
        onClick={onPick}
        className="mt-4 px-4 py-2 rounded-full bg-ink text-white text-xs font-semibold tracking-[0.06em]"
      >
        Reply to this
      </button>
    </article>
  );
}
