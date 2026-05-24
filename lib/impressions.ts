// Browser-side impression recorder. Batches candidate ids over a short
// window so we don't fire a POST per card swipe.

let queue: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_MS = 1500;
const MAX_BATCH = 20;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const payload = JSON.stringify({ candidateIds: batch });

  // sendBeacon survives tab close; falls back to keepalive fetch on browsers
  // that block beacon on non-binary content types.
  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/impressions", blob)) return;
  } catch {}
  fetch("/api/impressions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {});
}

export function recordImpression(candidateId: string) {
  if (!candidateId) return;
  if (queue.includes(candidateId)) return;
  queue.push(candidateId);
  if (queue.length >= MAX_BATCH) {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flush();
    return;
  }
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_MS);
}

// Fire immediately — useful on unmount or when leaving /discover.
export function flushImpressions() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  while (queue.length > 0) flush();
}
