"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export function FilterBar({
  initialAgeMin,
  initialAgeMax
}: {
  initialAgeMin: number;
  initialAgeMax: number;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "age">(null);
  const [ageMin, setAgeMin] = useState(initialAgeMin);
  const [ageMax, setAgeMax] = useState(initialAgeMax);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filterAgeMin: ageMin, filterAgeMax: ageMax })
    });
    setSaving(false);
    if (res.ok) {
      setSheet(null);
      router.refresh();
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-2 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          aria-label="Filters"
          onClick={() => setSheet("age")}
          className="shrink-0 w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-ink"
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
        <Chip onClick={() => setSheet("age")} label={`Age ${ageMin}–${ageMax}`} />
        <Chip onClick={() => setSheet("age")} label="Distance" />
        <Chip onClick={() => setSheet("age")} label="Intentions" />
        <Chip onClick={() => setSheet("age")} label="Height" />
      </div>

      {sheet === "age" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <h3 className="font-extrabold text-2xl tracking-[-0.03em]">Age range</h3>
            <p className="text-sm text-muted mt-1">Who do you want to see?</p>

            <div className="mt-6 space-y-5">
              <Range label="Min" value={ageMin} min={18} max={99} onChange={setAgeMin} />
              <Range label="Max" value={ageMax} min={18} max={99} onChange={setAgeMax} />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="flex-1 py-3 rounded-full border border-ink font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 rounded-full bg-ink text-white font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex items-center gap-1 pl-4 pr-2.5 py-2 rounded-full border border-ink text-[0.85rem] font-medium"
    >
      {label}
      <ChevronDown size={16} strokeWidth={2} />
    </button>
  );
}

function Range({
  label, value, min, max, onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-ink"
      />
    </label>
  );
}
