"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { INTERESTS, INTEREST_GROUPS, MAX_INTERESTS, labelFor } from "@/lib/interests";

const ACCENT = "#6D1F4E";

// Interest picker.
//
// The copy is careful to say these nudge rather than restrict, because the
// pairing really is soft — shared tags move someone up the queue and never
// exclude anyone. Promising a filter we do not implement would be worse
// than offering nothing.
export function InterestPicker({ current }: { current: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    setError(null);
    setPicked((p) => {
      if (p.includes(slug)) return p.filter((x) => x !== slug);
      if (p.length >= MAX_INTERESTS) {
        setError(`Pick up to ${MAX_INTERESTS}.`);
        return p;
      }
      return [...p, slug];
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: picked })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Couldn't save.");
        setSaving(false);
        return;
      }
      setOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network hiccup.");
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          {current.length === 0 ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3.5 py-1.5 text-xs font-semibold text-muted hover:bg-tint transition"
            >
              <Plus size={13} /> Add interests
            </button>
          ) : (
            <>
              {current.map((slug) => (
                <span
                  key={slug}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "var(--tint)" }}
                >
                  {labelFor(slug)}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-xs text-muted underline underline-offset-4"
              >
                edit
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          Shared interests nudge you together — they never limit who you can meet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted">
          {picked.length} / {MAX_INTERESTS} picked
        </p>
        <button
          type="button"
          onClick={() => { setOpen(false); setPicked(current); setError(null); }}
          aria-label="Close"
          className="p-1 text-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
        {INTEREST_GROUPS.map((group) => (
          <div key={group}>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
              {group}
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.filter((i) => i.group === group).map((i) => {
                const on = picked.includes(i.slug);
                return (
                  <button
                    key={i.slug}
                    type="button"
                    onClick={() => toggle(i.slug)}
                    aria-pressed={on}
                    className={
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition " +
                      (on ? "text-white" : "border-hairline text-ink hover:bg-tint")
                    }
                    style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-xs" style={{ color: "#D43A2F" }}>{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: ACCENT }}
      >
        <Check size={16} /> {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
