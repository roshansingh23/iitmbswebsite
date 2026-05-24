"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

const INTENTIONS = [
  { value: "", label: "Any" },
  { value: "Short-term", label: "Short-term" },
  { value: "Long-term", label: "Long-term" },
  { value: "Marriage", label: "Marriage" },
  { value: "Casual", label: "Casual" },
  { value: "Friends first", label: "Friends first" }
];

export type FilterValues = {
  filterAgeMin: number;
  filterAgeMax: number;
  filterIntentions: string | null;
  filterActiveToday: boolean;
  filterNewHere: boolean;
};

export function FilterBar({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<FilterValues>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v)
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  function reset() {
    setV({
      filterAgeMin: 18,
      filterAgeMax: 99,
      filterIntentions: null,
      filterActiveToday: false,
      filterNewHere: false
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-2 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          aria-label="Filters"
          onClick={() => setOpen(true)}
          className="shrink-0 w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-ink"
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
        <Chip onClick={() => setOpen(true)} label={`Age ${initial.filterAgeMin}–${initial.filterAgeMax}`} active />
        <Chip onClick={() => setOpen(true)} label={initial.filterIntentions || "Intentions"} active={!!initial.filterIntentions} />
        <Chip onClick={() => setOpen(true)} label="Active today" active={initial.filterActiveToday} />
        <Chip onClick={() => setOpen(true)} label="New here" active={initial.filterNewHere} />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-2xl tracking-[-0.03em]">Filters</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 -mr-2">
                <X size={22} strokeWidth={2} />
              </button>
            </div>
            <button onClick={reset} className="text-sm font-medium underline text-muted mb-6">
              Reset all
            </button>

            <Section title="Age range">
              <Range label="Min" value={v.filterAgeMin} min={18} max={99}
                onChange={(n) => setV({ ...v, filterAgeMin: n })} />
              <Range label="Max" value={v.filterAgeMax} min={18} max={99}
                onChange={(n) => setV({ ...v, filterAgeMax: n })} />
            </Section>

            <Section title="Dating intentions">
              <div className="flex flex-wrap gap-2">
                {INTENTIONS.map((i) => {
                  const active = (v.filterIntentions ?? "") === i.value;
                  return (
                    <button
                      key={i.value || "any"}
                      type="button"
                      onClick={() => setV({ ...v, filterIntentions: i.value || null })}
                      className={
                        "px-4 py-2 rounded-full border text-sm transition " +
                        (active
                          ? "bg-ink text-white border-ink"
                          : "border-hairline text-ink hover:bg-tint")
                      }
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Activity">
              <Toggle
                label="Active today"
                value={v.filterActiveToday}
                onChange={(b) => setV({ ...v, filterActiveToday: b })}
              />
              <Toggle
                label="New here"
                value={v.filterNewHere}
                onChange={(b) => setV({ ...v, filterNewHere: b })}
              />
            </Section>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                {saving ? "Saving…" : "Show profiles"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Chip({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-[0.85rem] font-medium border transition " +
        (active ? "border-ink" : "border-hairline text-muted")
      }
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Range({
  label, value, min, max, onChange
}: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-ink"
      />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between py-2"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={
          "relative inline-flex h-7 w-12 rounded-full border border-hairline transition " +
          (value ? "bg-ink" : "bg-white")
        }
      >
        <span
          className={
            "absolute top-[2px] h-5 w-5 rounded-full transition-all " +
            (value ? "left-[22px] bg-white" : "left-[2px] bg-ink")
          }
        />
      </span>
    </button>
  );
}
