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

// Bottom cookie + install advertisement. Cookie/privacy acceptance on top,
// "Download Mismatched" promo with the real PWA install below. The install
// prompt is captured early in layout.tsx onto window.__mismatchedInstallPrompt.
export function DownloadBanner() {
  const [show, setShow] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInstalled()) return;
    if (localStorage.getItem("mm_banner_dismissed") === "1") return;
    setShow(true);
    setCanInstall(!!window.__mismatchedInstallPrompt);
    function onPrompt() { setCanInstall(true); }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem("mm_banner_dismissed", "1");
    setShow(false);
  }

  async function download() {
    const deferred = typeof window !== "undefined" ? window.__mismatchedInstallPrompt : null;
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice.catch(() => null);
      } catch {}
      window.__mismatchedInstallPrompt = null;
      dismiss();
      return;
    }
    // iOS Safari has no install API — show the share-sheet hint instead.
    if (isIOS()) {
      setIosHint(true);
      return;
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] p-3 sm:p-4">
      <div
        className="mx-auto max-w-2xl rounded-2xl p-4 text-white flex items-center gap-3"
        style={{ background: "#0a0a0a", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
      >
        {/* Brand glyph */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg tracking-[-0.05em] shrink-0"
          style={{ background: "#6D1F4E" }}
        >
          M.
        </div>

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
