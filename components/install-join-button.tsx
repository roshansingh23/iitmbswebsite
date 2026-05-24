"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

// Chrome only fires beforeinstallprompt once, sometimes before React has
// hydrated. The layout.tsx inline script captures it onto window very
// early; we read from there.
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
  // Standalone display means the user already opened the installed app.
  // navigator.standalone is the iOS Safari signal.
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

export function InstallJoinButton({
  href = "/login",
  className,
  style,
  children
}: {
  href?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const [showIosHint, setShowIosHint] = useState(false);
  const [showAcceptedHint, setShowAcceptedHint] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    // Already running as an installed PWA — go straight to sign-in.
    if (isInstalled()) {
      router.push(href);
      return;
    }

    const deferred = typeof window !== "undefined" ? window.__mismatchedInstallPrompt : null;
    if (deferred) {
      let outcome: "accepted" | "dismissed" | null = null;
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        outcome = choice?.outcome ?? null;
      } catch {}
      window.__mismatchedInstallPrompt = null;

      // After install, the user should open the app from their home
      // screen — don't redirect them to sign-in inside the browser tab.
      if (outcome === "accepted") {
        setShowAcceptedHint(true);
        return;
      }
      // Dismissed (or unknown): let them sign in via the browser.
      router.push(href);
      return;
    }

    // iOS Safari has no install API — guide the user to the share menu.
    if (isIOSSafari()) {
      setShowIosHint(true);
      return;
    }

    // Fallback: just navigate.
    router.push(href);
  }

  return (
    <>
      <a href={href} onClick={handleClick} className={className} style={style}>
        {children}
      </a>

      {showIosHint && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          onClick={() => setShowIosHint(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <h3 className="font-extrabold text-2xl tracking-[-0.03em]">Add Mismatched to your home screen</h3>
            <p className="mt-2 text-sm text-muted">
              On iPhone, tap the <strong>Share</strong> button in Safari, then{" "}
              <strong>Add to Home Screen</strong>. Open the new icon to sign in.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowIosHint(false)}
                className="flex-1 py-3 rounded-full border border-ink font-semibold text-sm"
              >
                Got it
              </button>
              <button
                onClick={() => { setShowIosHint(false); router.push(href); }}
                className="flex-1 py-3 rounded-full bg-ink text-white font-semibold text-sm"
              >
                Continue to sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {showAcceptedHint && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          onClick={() => setShowAcceptedHint(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <h3 className="font-extrabold text-2xl tracking-[-0.03em]">Mismatched is installing.</h3>
            <p className="mt-2 text-sm text-muted">
              Find the new <strong>Mismatched</strong> icon on your home screen and open
              it from there to sign in.
            </p>
            <button
              onClick={() => setShowAcceptedHint(false)}
              className="mt-5 w-full py-3 rounded-full bg-ink text-white font-semibold text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
