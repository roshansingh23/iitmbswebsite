"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_PUBLIC
    ) {
      setSupported(false);
      return;
    }
    (async () => {
      if (Notification.permission !== "granted") { setOn(false); return; }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setOn(!!sub);
      } catch { setOn(false); }
    })();
  }, []);

  async function enable(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing
      ? existing
      : await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource
        });
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth } })
    });
    return true;
  }

  async function disable() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
    } catch {}
  }

  async function toggle() {
    if (busy || !supported) return;
    setBusy(true);
    try {
      if (on) { await disable(); setOn(false); }
      else { setOn(await enable()); }
    } catch {}
    setBusy(false);
  }

  if (!supported) {
    return <span className="text-xs text-muted">Not supported here</span>;
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className={
        "relative inline-flex h-7 w-12 rounded-full border border-hairline transition shrink-0 " +
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
