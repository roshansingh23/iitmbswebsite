"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ChatMenu } from "@/components/chat-menu";
import { Button } from "@/components/ui/button";

type Msg = { id: string; body: string; fromUserId: string; createdAt: string };

const NAV_HEIGHT_PX = 64;

export function ChatRoom({
  conversationId,
  meId,
  otherUserId,
  otherName,
  otherVerified,
  otherActive,
  otherPhoto,
  initialMessages,
  initialLocked
}: {
  conversationId: string;
  meId: string;
  otherUserId: string;
  otherName: string;
  otherVerified: boolean;
  otherActive: boolean;
  otherPhoto: string | null;
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

  useEffect(() => {
    function ping() {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/chat/${conversationId}/heartbeat`, { method: "POST" }).catch(() => {});
    }
    ping();
    const t = setInterval(ping, 30_000);
    return () => clearInterval(t);
  }, [conversationId]);

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

  async function send() {
    const text = body.trim();
    if (!text || sending || locked) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Msg = { id: tempId, body: text, fromUserId: meId, createdAt: new Date().toISOString() };
    setBody("");
    setMsgs((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.locked) setLocked(true);
        setMsgs((m) => m.filter((x) => x.id !== tempId));
        return;
      }
      const data = await res.json();
      setMsgs((m) => m.map((x) => (x.id === tempId ? data.message : x)));
    } catch {
      setMsgs((m) => m.filter((x) => x.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Fixed chat header with avatar + name + active dot + 3-dot menu */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-hairline">
        <div className="mx-auto max-w-md h-14 px-3 flex items-center gap-2">
          <Link href="/matches" aria-label="Back" className="p-2 -ml-2 text-ink active:scale-95 transition">
            <ArrowLeft size={22} strokeWidth={2} />
          </Link>

          <Link
            href={`/profile/${otherUserId}`}
            className="flex-1 flex items-center gap-3 min-w-0 active:opacity-70 transition"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-tint shrink-0">
              {otherPhoto && (
                <Image src={otherPhoto} alt="" fill className="object-cover" sizes="36px" />
              )}
              {otherActive && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: "#22C55E" }}
                  aria-label="Active"
                />
              )}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="font-extrabold text-base tracking-[-0.02em] truncate">{otherName}</h1>
              {otherVerified && (
                <BadgeCheck
                  size={16}
                  strokeWidth={2}
                  style={{ color: "#D43A2F", fill: "transparent" }}
                  aria-label="Verified"
                />
              )}
            </div>
          </Link>

          <ChatMenu otherUserId={otherUserId} otherName={otherName} />
        </div>
      </header>

      <div
        ref={scroller}
        className="overflow-y-auto"
        style={{
          paddingTop: "56px",
          minHeight: `calc(100vh - 56px - 64px - ${NAV_HEIGHT_PX}px - env(safe-area-inset-bottom))`,
          paddingBottom: `calc(${NAV_HEIGHT_PX + 70}px + env(safe-area-inset-bottom))`
        }}
      >
        <div className="mx-auto max-w-md px-4 py-4 space-y-3">
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

      <div
        className="fixed inset-x-0 z-30 bg-white border-t border-hairline"
        style={{ bottom: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom))` }}
      >
        <div className="mx-auto max-w-md px-4 py-3">
          {locked ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-snug">
                This chat is paused. Upgrade to keep talking.
              </p>
              <Link
                href="/upgrade"
                className="shrink-0 px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold"
              >
                Upgrade
              </Link>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Message"
                rows={1}
                maxLength={1000}
                className="field min-h-[2.5rem] resize-none"
              />
              <Button onClick={send} disabled={sending || !body.trim()}>Send</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
