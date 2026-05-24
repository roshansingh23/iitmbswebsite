"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PhotoUploader } from "@/components/photo-uploader";

type Gender = "man" | "woman" | "nonbinary" | "other";
type Orientation = "straight" | "gay" | "lesbian" | "bisexual" | "pansexual" | "asexual" | "other";

type Initial = {
  name: string;
  age: number | null;
  bio: string;
  gender: Gender | null;
  orientation: Orientation | null;
  showMe: Gender[];
};

const GENDERS: { value: Gender; label: string }[] = [
  { value: "man", label: "Man" },
  { value: "woman", label: "Woman" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "other", label: "Other" }
];

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "gay", label: "Gay" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual" },
  { value: "other", label: "Other" }
];

export function OnboardingFlow({
  initial,
  promptBank
}: {
  initial: Initial;
  promptBank: { id: string; text: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<Initial>(initial);
  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>([]);
  const [answers, setAnswers] = useState<{ promptId: string; answer: string }[]>([]);
  const [saving, setSaving] = useState(false);

  function next() { setStep((s) => Math.min(s + 1, 4)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...state, photos, answers })
    });
    setSaving(false);
    if (res.ok) router.push("/discover");
  }

  return (
    <div className="space-y-10">
      <Stepper step={step} />

      {step === 0 && (
        <section className="space-y-6">
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={state.name} onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))} placeholder="What people call you" />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" min={18} max={99} value={state.age ?? ""} onChange={(e) => setState((s) => ({ ...s, age: e.target.value ? Number(e.target.value) : null }))} />
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-10">
          <div>
            <Label>I am</Label>
            <ChipGroup options={GENDERS} value={state.gender} onChange={(v) => setState((s) => ({ ...s, gender: v }))} />
          </div>
          <div>
            <Label>Orientation</Label>
            <ChipGroup options={ORIENTATIONS} value={state.orientation} onChange={(v) => setState((s) => ({ ...s, orientation: v }))} />
          </div>
          <div>
            <Label>Show me</Label>
            <ChipGroup
              multi
              options={GENDERS}
              value={state.showMe}
              onChange={(v) => setState((s) => ({ ...s, showMe: v }))}
            />
            <p className="mt-3 text-xs text-muted">You only appear to people whose preferences include you.</p>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <Label>Photos</Label>
          <p className="text-xs text-muted -mt-1 mb-5">Add as many as you like. Drag to reorder.</p>
          <PhotoUploader value={photos} onChange={setPhotos} />
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8">
          <Label>Answer three prompts</Label>
          <PromptAnswerer bank={promptBank} value={answers} onChange={setAnswers} />
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <Label>Anything else</Label>
          <Textarea
            placeholder="Short bio. Optional."
            value={state.bio}
            onChange={(e) => setState((s) => ({ ...s, bio: e.target.value }))}
          />
        </section>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-hairline">
        <Button variant="line" onClick={back} disabled={step === 0}>Back</Button>
        {step < 4 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Finish"}</Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className={`h-[2px] flex-1 ${i <= step ? "bg-ink" : "bg-hairline"}`} />
      ))}
    </ol>
  );
}

function ChipGroup<T extends string>({
  options, value, onChange, multi
}: {
  options: { value: T; label: string }[];
  value: T | T[] | null;
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const selected = multi
    ? new Set<string>(((value as T[]) ?? []) as string[])
    : new Set<string>(value ? [value as string] : []);
  function toggle(v: T) {
    if (!multi) return onChange(v);
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange(Array.from(next));
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={
              "px-4 py-2 rounded-full text-sm border transition " +
              (on
                ? "bg-ink text-bone border-ink"
                : "border-hairline text-ink hover:bg-tint")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PromptAnswerer({
  bank, value, onChange
}: {
  bank: { id: string; text: string }[];
  value: { promptId: string; answer: string }[];
  onChange: (v: { promptId: string; answer: string }[]) => void;
}) {
  function setAt(i: number, patch: Partial<{ promptId: string; answer: string }>) {
    const next = [...value];
    next[i] = { ...(next[i] ?? { promptId: "", answer: "" }), ...patch };
    onChange(next);
  }
  function add() {
    if (value.length >= 6) return;
    onChange([...value, { promptId: "", answer: "" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  // Seed three empty slots on first render — never mutate state during render.
  useEffect(() => {
    if (value.length === 0) {
      onChange([
        { promptId: "", answer: "" },
        { promptId: "", answer: "" },
        { promptId: "", answer: "" }
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const used = new Set(value.map((v) => v.promptId));
  const slots = value.length === 0
    ? [{ promptId: "", answer: "" }, { promptId: "", answer: "" }, { promptId: "", answer: "" }]
    : value;

  return (
    <div className="space-y-8">
      {slots.map((row, i) => (
        <div key={i} className="card-line p-6">
          <select
            className="field"
            value={row.promptId}
            onChange={(e) => setAt(i, { promptId: e.target.value })}
          >
            <option value="">Pick a question…</option>
            {bank
              .filter((p) => p.id === row.promptId || !used.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>{p.text}</option>
              ))}
          </select>
          <Textarea
            className="mt-4"
            placeholder="Your answer"
            value={row.answer}
            onChange={(e) => setAt(i, { answer: e.target.value })}
          />
          {value.length > 3 && (
            <button type="button" onClick={() => remove(i)} className="mt-3 text-xs text-muted underline">
              remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="btn-quiet">Add another</button>
    </div>
  );
}
