"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, X } from "lucide-react";

// Tap → opens a camera modal → scans a QR → if it resolves to a /u/[qr] URL
// on this origin, navigate there. Otherwise show the raw payload.
export function ScanQrButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hit, setHit] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const QrScannerMod = await import("qr-scanner");
        const QrScanner = QrScannerMod.default ?? QrScannerMod;
        if (cancelled || !videoRef.current) return;
        const scanner = new QrScanner(
          videoRef.current,
          (result: any) => {
            const text = typeof result === "string" ? result : result.data;
            handleResult(text);
          },
          { highlightScanRegion: true, highlightCodeOutline: true }
        );
        scannerRef.current = scanner;
        await scanner.start();
      } catch (e: any) {
        setErr(e?.message ?? "Couldn't open the camera. Allow camera access and try again.");
      }
    })();

    return () => {
      cancelled = true;
      try { scannerRef.current?.stop?.(); scannerRef.current?.destroy?.(); } catch {}
      scannerRef.current = null;
    };
  }, [open]);

  function handleResult(text: string) {
    if (!text) return;
    setHit(text);
    try { scannerRef.current?.stop?.(); } catch {}
    // If the QR encodes a URL on this origin, navigate to it.
    try {
      const u = new URL(text);
      if (u.origin === window.location.origin) {
        setOpen(false);
        router.push(u.pathname + u.search);
        return;
      }
    } catch {
      // Not a URL — treat as raw qrCode token and route to /u/[token]
      if (/^[A-Za-z0-9_-]{4,32}$/.test(text)) {
        setOpen(false);
        router.push(`/u/${text}`);
        return;
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setHit(null); setErr(null); setOpen(true); }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-sm font-semibold"
      >
        <ScanLine size={16} strokeWidth={2.25} />
        Scan QR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0a0a" }}>
          <header className="flex items-center justify-between h-14 px-4">
            <p className="text-white text-sm font-semibold">Scan a QR</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 -mr-2 text-white">
              <X size={22} strokeWidth={2} />
            </button>
          </header>

          <div className="relative flex-1 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {err && (
              <div className="absolute inset-x-0 bottom-20 px-6">
                <div className="bg-white rounded-2xl p-4 text-sm">{err}</div>
              </div>
            )}
            {hit && !err && (
              <div className="absolute inset-x-0 bottom-20 px-6">
                <div className="bg-white rounded-2xl p-4 text-sm break-all">{hit}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
