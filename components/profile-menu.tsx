"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";

// Three-dots menu shown beside a candidate's name in the discover feed.
// Two options: Remove (passes the profile) and Report (red, opens dialog).
export function ProfileMenu({
  candidateId,
  candidateName,
  onRemove
}: {
  candidateId: string;
  candidateName: string;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Close menu when clicking outside.
  useEffect(() => {
    if (!menuOpen) return;
    function onDoc() { setMenuOpen(false); }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [menuOpen]);

  async function submitReport() {
    if (!reason.trim() || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "user",
          targetId: candidateId,
          reason: reason.trim()
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't send report");
      }
      setSent(true);
      // After a successful report we also remove the profile from view.
      setTimeout(() => {
        setReportOpen(false);
        onRemove();
      }, 800);
    } catch (e: any) {
      setErr(e.message ?? "Couldn't send report");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="More"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 -mr-2 text-ink"
        >
          <MoreHorizontal size={22} strokeWidth={2} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 z-30 w-48 card-line py-1.5 text-sm">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onRemove(); }}
              className="block w-full text-left px-4 py-2.5 hover:bg-tint transition"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setReportOpen(true); }}
              className="block w-full text-left px-4 py-2.5 hover:bg-tint transition"
              style={{ color: "#D43A2F" }}
            >
              Report
            </button>
          </div>
        )}
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          onClick={() => !sending && setReportOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-2xl tracking-[-0.03em]" style={{ color: "#D43A2F" }}>
                Report {candidateName}
              </h3>
              <button onClick={() => setReportOpen(false)} aria-label="Close" className="p-2 -mr-2">
                <X size={22} strokeWidth={2} />
              </button>
            </div>
            <p className="text-sm text-muted">
              Tell us what's wrong. We read every report.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="What happened?"
              className="mt-4 w-full border border-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-ink"
            />

            {err && <p className="mt-3 text-sm" style={{ color: "#D43A2F" }}>{err}</p>}
            {sent && <p className="mt-3 text-sm text-ink">Report sent. Thanks for telling us.</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={sending}
                className="flex-1 py-3 rounded-full border border-ink font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReport}
                disabled={sending || !reason.trim() || sent}
                className="flex-1 py-3 rounded-full text-white font-semibold text-sm disabled:opacity-60"
                style={{ background: "#D43A2F" }}
              >
                {sending ? "Sending…" : sent ? "Sent" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
