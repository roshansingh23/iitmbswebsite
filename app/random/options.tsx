"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { INTERESTS, INTEREST_GROUPS, MAX_INTERESTS } from "@/lib/interests";
import { DISPLAY_NAME_MAX } from "@/lib/anon-name";

const ACCENT = "#6D1F4E";
const REQUIRED_RED = "#C41111";

// Everything the sheet can change, in one form with one Save.
//
// Nothing is written until Save is pressed: the pieces used to commit
// themselves as you tapped, which meant a half-made set of choices was
// already live and there was no way to back out of one.

const GENDER = [
  { value: "anyone", label: "Anyone" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" }
];

const WORKSPACE = [
  { value: "same", label: "Same workspace" },
  { value: "different", label: "Different workspace" },
  { value: "any", label: "Either" }
];

export function RandomOptions({
  initialGender,
  initialWorkspace,
  initialInterests,
  initialName,
  onSaved
}: {
  initialGender: string;
  initialWorkspace: string;
  initialInterests: string[];
  initialName: string | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [gender, setGender] = useState(initialGender);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);

  const dirty =
    gender !== initialGender ||
    workspace !== initialWorkspace ||
    name !== (initialName ?? "") ||
    interests.length !== initialInterests.length ||
    interests.some((i) => !initialInterests.includes(i));

  function toggleInterest(slug: string) {
    setError(null);
    setInterests((cur) => {
      if (cur.includes(slug)) return cur.filter((x) => x !== slug);
      if (cur.length >= MAX_INTERESTS) {
        setError(`Pick up to ${MAX_INTERESTS} interests.`);
        return cur;
      }
      return [...cur, slug];
    });
  }

  async function save() {
    // The asterisk has to mean something, or it is decoration.
    if (interests.length === 0) {
      setError("Pick at least one interest.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          randomPrefGender: gender,
          randomPrefWorkspace: workspace,
          interests,
          // Empty clears the handle and puts you back on per-chat aliases.
          displayName: name.trim() ? name.trim() : null
        })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? "Couldn't save.");
        setSaving(false);
        return;
      }
      setSaving(false);
      setSavedAt(Date.now());
      router.refresh();
      onSaved?.();
    } catch {
      setError("Network hiccup.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ChipRow label="Talk to" options={GENDER} value={gender} onChange={setGender} />
      <ChipRow label="Workspace" options={WORKSPACE} value={workspace} onChange={setWorkspace} />
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
          Interests
          <RequiredMark />
          <span className="ml-1 normal-case tracking-normal font-normal">
            {interests.length}/{MAX_INTERESTS}
          </span>
        </p>
        <div className="space-y-3.5">
          {INTEREST_GROUPS.map((group) => (
            <div key={group}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted mb-1.5">{group}</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.filter((i) => i.group === group).map((i) => {
                  const on = interests.includes(i.slug);
                  return (
                    <button
                      key={i.slug}
                      type="button"
                      onClick={() => toggleInterest(i.slug)}
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
      </div>

      <div>
        <label
          htmlFor="anon-name"
          className="block text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2"
        >
          The name strangers see
        </label>
        <input
          id="anon-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null); }}
          maxLength={DISPLAY_NAME_MAX}
          placeholder="A new name each chat"
          className="w-full rounded-full bg-tint px-4 py-2.5 text-sm outline-none placeholder:text-ink/40"
        />
      </div>

      {error && <p className="text-xs" style={{ color: "#D43A2F" }}>{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition disabled:opacity-40"
        style={{ background: ACCENT }}
      >
        <Check size={16} />
        {saving ? "Saving…" : savedAt && !dirty ? "Saved" : "Save"}
      </button>
    </div>
  );
}

// Red asterisk on anything that has to be set before Save will go through.
export function RequiredMark() {
  return (
    <span style={{ color: REQUIRED_RED }} aria-hidden>
      {" *"}
    </span>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
        {label}
        <RequiredMark />
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className={
                "rounded-full px-3.5 py-1.5 text-xs font-semibold border transition " +
                (on ? "text-white" : "border-hairline text-ink hover:bg-tint")
              }
              style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
