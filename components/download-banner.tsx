"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

declare global {
  interface Window {
    __mismatchedInstallPrompt?: {
      prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    } | null;
  }
}

function isInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

const FIRST_DELAY = 4000;       // first popup ~4s after load
const REAPPEAR_MS = 90_000;     // reappear ~90s after a dismissal
const DISMISS_KEY = "mm_banner_dismissed_at";

// Recurring "Get the app" popup for non-app (browser) users only. Slides
// up from the bottom, reappears periodically after dismissal, and never
// shows once the PWA is installed. The PWA install prompt is captured
// early in layout.tsx onto window.__mismatchedInstallPrompt.
export function DownloadBanner() {
  const [show, setShow] = useState(false);
  const [slid, setSlid] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  // Scheduling — appear, and re-appear after dismissal, for non-app users.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInstalled()) return;

    function onPrompt() { /* keep prompt fresh; no UI change needed */ }
    window.addEventListener("beforeinstallprompt", onPrompt);

    let timer: ReturnType<typeof setTimeout>;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const since = Date.now() - dismissedAt;
    const delay = since >= REAPPEAR_MS ? FIRST_DELAY : REAPPEAR_MS - since;
    timer = setTimeout(() => setShow(true), delay);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  // Slide-in whenever it becomes visible.
  useEffect(() => {
    if (!show) { setSlid(false); return; }
    const t = setTimeout(() => setSlid(true), 20);
    return () => clearTimeout(t);
  }, [show]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setSlid(false);
    setIosHint(false);
    // Let the slide-out finish, then hide and schedule the next appearance.
    setTimeout(() => setShow(false), 300);
    setTimeout(() => {
      if (!isInstalled()) setShow(true);
    }, REAPPEAR_MS);
  }

  async function download() {
    const deferred = typeof window !== "undefined" ? window.__mismatchedInstallPrompt : null;
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice.catch(() => null);
      } catch {}
      window.__mismatchedInstallPrompt = null;
      // Installed (or chose) — stop nagging this session.
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setSlid(false);
      setTimeout(() => setShow(false), 300);
      return;
    }
    if (isIOS()) {
      setIosHint(true);
      return;
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-3 sm:p-4 pointer-events-none">
      <div
        className={
          "mx-auto max-w-2xl rounded-2xl p-4 text-white flex items-center gap-3 pointer-events-auto transition-transform duration-300 ease-out " +
          (slid ? "translate-y-0" : "translate-y-[160%]")
        }
        style={{ background: "#0a0a0a", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
      >
        {iosHint ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">
              Tap <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.
            </p>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Get the Mismatched app</p>
            <p className="text-xs text-white/55 leading-tight mt-0.5">Faster, smoother, full-screen.</p>
          </div>
        )}

        <button
          onClick={iosHint ? dismiss : download}
          className="px-4 py-2.5 rounded-full text-xs font-semibold text-white whitespace-nowrap shrink-0"
          style={{ background: "#6D1F4E" }}
        >
          {iosHint ? "Got it" : "Download"}
        </button>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 text-white/55 hover:text-white shrink-0"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
