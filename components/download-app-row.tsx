"use client";

import { useEffect, useState } from "react";

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

// "Download the app" row for the profile/settings page. Renders only in a
// browser (not the installed PWA). Triggers the captured install prompt;
// iOS gets the Add-to-Home-Screen hint.
export function DownloadAppRow() {
  // Start hidden to avoid a flash before the standalone check runs.
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!isInstalled()) setShow(true);
  }, []);

  async function install() {
    const deferred = typeof window !== "undefined" ? window.__mismatchedInstallPrompt : null;
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice.catch(() => null);
      } catch {}
      window.__mismatchedInstallPrompt = null;
      if (isInstalled()) setShow(false);
      return;
    }
    if (isIOS()) { setIosHint(true); return; }
  }

  if (!show) return null;

  return (
    <section className="mt-10 card-line p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">Download the app</p>
          <p className="text-sm text-muted mt-1">
            Faster, full-screen, and notifications even when it's closed.
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 px-5 py-2.5 rounded-full text-white text-sm font-semibold"
          style={{ background: "#6D1F4E" }}
        >
          Download
        </button>
      </div>
      {iosHint && (
        <p className="mt-3 text-xs text-muted">
          On iPhone, tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install.
        </p>
      )}
    </section>
  );
}
