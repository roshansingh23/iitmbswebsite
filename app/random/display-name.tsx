"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { DISPLAY_NAME_MAX } from "@/lib/anon-name";

const ACCENT = "#6D1F4E";

// "You appear as ___" — the handle strangers see in random chat.
//
// A member who has never set one is shown the alias generated for their
// current session, and told it changes each time. Setting a handle makes it
// stick; clearing it puts them back on generated aliases.
export function DisplayNameEditor({ current }: { current: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: next })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? "Couldn't save that name.");
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition"
      >
        <span>
          You appear as{" "}
          <b className="text-ink">{current ?? "a new name each chat"}</b>
        </span>
        <Pencil size={13} />
      </button>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="anon-name" className="block text-xs font-semibold text-muted mb-2">
        The name strangers see
      </label>
      <div className="flex items-center gap-2">
        <input
          id="anon-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={DISPLAY_NAME_MAX}
          autoFocus
          placeholder="Anything you like"
          className="flex-1 min-w-0 rounded-full bg-tint px-4 py-2.5 text-sm outline-none placeholder:text-ink/40"
        />
        <button
          type="button"
          onClick={() => save(value.trim() ? value : null)}
          disabled={saving}
          aria-label="Save name"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setValue(current ?? ""); setError(null); }}
          aria-label="Cancel"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-hairline text-muted"
        >
          <X size={16} />
        </button>
      </div>

      {error && <p className="mt-2 text-xs" style={{ color: "#D43A2F" }}>{error}</p>}

      <p className="mt-2 text-xs text-muted">
        Your real name is never shown here — only if you both choose to
        swap profiles.
      </p>

      {current && (
        <button
          type="button"
          onClick={() => save(null)}
          disabled={saving}
          className="mt-3 text-xs text-muted underline underline-offset-4"
        >
          Use a new name each chat instead
        </button>
      )}
    </div>
  );
}
