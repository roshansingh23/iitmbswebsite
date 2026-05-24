"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";

type PromptOption = { id: string; text: string };

export function AddPromptButton({
  bank,
  alreadyUsed
}: {
  bank: PromptOption[];
  alreadyUsed: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [promptId, setPromptId] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const usedSet = new Set(alreadyUsed);
  const available = bank.filter((p) => !usedSet.has(p.id));

  async function save() {
    if (!promptId || !answer.trim()) return;
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/me/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, answer: answer.trim() })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "Couldn't save");
      return;
    }
    setOpen(false);
    setPromptId("");
    setAnswer("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 underline"
      >
        <Plus size={16} strokeWidth={2.25} />
        Add prompt
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => !saving && setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-2xl tracking-[-0.03em]">Add a prompt</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 -mr-2">
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Pick a question</span>
              <select
                className="field mt-2"
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
              >
                <option value="">Choose one…</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>{p.text}</option>
                ))}
              </select>
            </label>

            <label className="block mt-5">
              <span className="text-sm font-medium">Your answer</span>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={280}
                rows={4}
                className="mt-2 w-full border border-hairline rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-ink"
              />
            </label>

            {err && <p className="mt-3 text-sm text-ink">{err}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="flex-1 py-3 rounded-full border border-ink font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !promptId || !answer.trim()}
                className="flex-1 py-3 rounded-full bg-ink text-white font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Add prompt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
