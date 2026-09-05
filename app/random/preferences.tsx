"use client";

import { useState } from "react";

const ACCENT = "#6D1F4E";

// Who you'd like to be paired with.
//
// These are captured and saved, but the matchmaker does not read them yet —
// it still pairs inside one pool with no gender filter. The chips say so
// rather than pretending to work, because a filter that silently does
// nothing is worse than one that isn't there.

type Pref = { value: string; label: string };

const GENDER: Pref[] = [
  { value: "anyone", label: "Anyone" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" }
];

const WORKSPACE: Pref[] = [
  { value: "same", label: "Same workspace" },
  { value: "different", label: "Different workspace" },
  { value: "any", label: "Either" }
];

export function RandomPreferences({
  initialGender,
  initialWorkspace
}: {
  initialGender: string;
  initialWorkspace: string;
}) {
  const [gender, setGender] = useState(initialGender);
  const [workspace, setWorkspace] = useState(initialWorkspace);

  // Fire-and-forget: a failed save must never interrupt the search running
  // behind this panel.
  function save(patch: Record<string, string>) {
    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <Row
        label="Talk to"
        options={GENDER}
        value={gender}
        onChange={(v) => { setGender(v); save({ randomPrefGender: v }); }}
      />
      <Row
        label="Workspace"
        options={WORKSPACE}
        value={workspace}
        onChange={(v) => { setWorkspace(v); save({ randomPrefWorkspace: v }); }}
      />
      <p className="text-[11px] text-muted">
        Saved for later — pairing doesn&apos;t use these yet.
      </p>
    </div>
  );
}

function Row({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Pref[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
        {label}
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
