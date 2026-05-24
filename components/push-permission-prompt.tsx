"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

// Converts the URL-safe base64 VAPID public key into the Uint8Array
// that PushManager.subscribe expects.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const STORAGE_KEY = "mm_push_prompted";

async function subscribePush(): Promise<void> {
  if (!VAPID_PUBLIC) return;
  const reg = await navigator.serviceWorker.ready;
  // Reuse an existing subscription if the browser already has one (e.g.
  // user re-opens the PWA on a device they previously subscribed on).
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
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth }
    })
  });
}

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  // Register the service worker once. Idempotent.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Decide what to do on first app open:
  //   - permission granted already → silently make sure the server has a
  //     subscription on file, no UI
  //   - default + never asked → show the one-time soft prompt right after
  //     the splash settles
  //   - denied or previously dismissed → do nothing
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!VAPID_PUBLIC) return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    if (Notification.permission === "granted") {
      subscribePush().catch(() => {});
      return;
    }
    if (Notification.permission === "denied") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    // Show right after the splash overlay finishes (1.8s) so the prompt
    // is among the first things the user sees on app open.
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      // Stamp localStorage first — if the OS prompt is denied we still
      // honour the "one time" intent and never re-ask.
      localStorage.setItem(STORAGE_KEY, "1");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }
      await subscribePush();
    } catch {}
    setShow(false);
    setBusy(false);
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-4 z-40 lg:inset-x-auto lg:right-6 lg:max-w-sm"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
      role="dialog"
      aria-label="Turn on notifications"
    >
      <div className="bg-white border border-hairline rounded-2xl p-4 flex items-start gap-3"
        style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}
      >
        <div className="w-10 h-10 rounded-full bg-tint flex items-center justify-center shrink-0">
          <Bell size={18} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">Turn on notifications</p>
          <p className="mt-0.5 text-xs text-muted leading-snug">
            Get pinged for new matches and messages — even when the app is closed.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="px-3.5 py-2 rounded-full bg-ink text-white text-xs font-semibold disabled:opacity-60"
            >
              {busy ? "Enabling…" : "Turn on"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3.5 py-2 rounded-full border border-hairline text-xs font-semibold"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 text-muted hover:text-ink transition"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
