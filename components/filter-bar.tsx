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

type Sheet = null | "all" | "age" | "intentions";

export function FilterBar({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [v, setV] = useState<FilterValues>(initial);
  const [saving, setSaving] = useState(false);

  async function patch(partial: Partial<FilterValues>) {
    const merged = { ...v, ...partial };
    setV(merged);
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial)
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  async function saveSheet() {
    setSaving(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v)
    });
    setSaving(false);
    setSheet(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-2 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          aria-label="All filters"
          onClick={() => setSheet("all")}
          className="shrink-0 w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-ink active:scale-[0.95] transition"
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>

        <Chip
          onClick={() => setSheet("age")}
          label={`Age ${v.filterAgeMin}–${v.filterAgeMax}`}
          active
        />
        <Chip
          onClick={() => setSheet("intentions")}
          label={v.filterIntentions || "Intentions"}
          active={!!v.filterIntentions}
        />
        {/* Direct-toggle chips — one tap saves and refreshes */}
        <Chip
          onClick={() => patch({ filterActiveToday: !v.filterActiveToday })}
          label="Active today"
          active={v.filterActiveToday}
        />
        <Chip
          onClick={() => patch({ filterNewHere: !v.filterNewHere })}
          label="New here"
          active={v.filterNewHere}
        />
      </div>

      {/* All-filters sheet */}
      {sheet === "all" && (
        <Modal onClose={() => setSheet(null)} title="Filters">
          <SectionAge v={v} onChange={(p) => setV({ ...v, ...p })} />
          <SectionIntentions v={v} onChange={(p) => setV({ ...v, ...p })} />
          <SectionToggles v={v} onChange={(p) => setV({ ...v, ...p })} />
          <Actions onCancel={() => setSheet(null)} onSave={saveSheet} saving={saving} />
        </Modal>
      )}

      {sheet === "age" && (
        <Modal onClose={() => setSheet(null)} title="Age range">
          <SectionAge v={v} onChange={(p) => setV({ ...v, ...p })} />
          <Actions onCancel={() => setSheet(null)} onSave={saveSheet} saving={saving} />
        </Modal>
      )}

      {sheet === "intentions" && (
        <Modal onClose={() => setSheet(null)} title="Dating intentions">
          <SectionIntentions v={v} onChange={(p) => setV({ ...v, ...p })} />
          <Actions onCancel={() => setSheet(null)} onSave={saveSheet} saving={saving} />
        </Modal>
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
        "shrink-0 px-4 py-2 rounded-full text-[0.85rem] font-medium border transition active:scale-[0.97] " +
        (active ? "bg-ink text-white border-ink" : "border-hairline text-ink")
      }
    >
      {label}
    </button>
  );
}

function Modal({
  title, onClose, children
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-2xl tracking-[-0.03em]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2">
            <X size={22} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionAge({
  v, onChange
}: { v: FilterValues; onChange: (p: Partial<FilterValues>) => void }) {
  return (
    <section className="mt-2 space-y-3">
      <Range label="Min" value={v.filterAgeMin} min={18} max={99} onChange={(n) => onChange({ filterAgeMin: n })} />
      <Range label="Max" value={v.filterAgeMax} min={18} max={99} onChange={(n) => onChange({ filterAgeMax: n })} />
    </section>
  );
}

function SectionIntentions({
  v, onChange
}: { v: FilterValues; onChange: (p: Partial<FilterValues>) => void }) {
  return (
    <section className="mt-4">
      <h4 className="font-semibold text-sm mb-3">Dating intentions</h4>
      <div className="flex flex-wrap gap-2">
        {INTENTIONS.map((i) => {
          const active = (v.filterIntentions ?? "") === i.value;
          return (
            <button
              key={i.value || "any"}
              type="button"
              onClick={() => onChange({ filterIntentions: i.value || null })}
              className={
                "px-4 py-2 rounded-full border text-sm transition active:scale-[0.97] " +
                (active ? "bg-ink text-white border-ink" : "border-hairline text-ink")
              }
            >
              {i.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SectionToggles({
  v, onChange
}: { v: FilterValues; onChange: (p: Partial<FilterValues>) => void }) {
  return (
    <section className="mt-6">
      <h4 className="font-semibold text-sm mb-3">Activity</h4>
      <Toggle
        label="Active today"
        value={v.filterActiveToday}
        onChange={(b) => onChange({ filterActiveToday: b })}
      />
      <Toggle
        label="New here"
        value={v.filterNewHere}
        onChange={(b) => onChange({ filterNewHere: b })}
      />
    </section>
  );
}

function Actions({
  onCancel, onSave, saving
}: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 rounded-full border border-ink font-semibold text-sm active:scale-[0.97] transition"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex-1 py-3 rounded-full bg-ink text-white font-semibold text-sm active:scale-[0.97] disabled:opacity-60 transition"
      >
        {saving ? "Saving…" : "Apply"}
      </button>
    </div>
  );
}

function Range({
  label, value, min, max, onChange
}: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
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
