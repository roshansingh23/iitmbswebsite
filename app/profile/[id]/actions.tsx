"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PhotoCard } from "@/components/photo-card";
import { PromptBlock } from "@/components/prompt-block";

type Target =
  | { kind: "photo"; id: string }
  | { kind: "prompt"; id: string }
  | { kind: "profile" };

export function ProfileHookActions({
  toUserId,
  alreadyHooked,
  photos,
  userPrompts
}: {
  toUserId: string;
  alreadyHooked: boolean;
  photos: { id: string; url: string }[];
  userPrompts: { id: string; question: string; answer: string }[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target | null>(null);
  const [note, setNote] = useState("");
  const [hard, setHard] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyHooked);

  async function send() {
    if (!target) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/hooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId,
        targetType: target.kind,
        targetId: target.kind === "profile" ? null : target.id,
        note: note.trim() || null,
        isHardHook: hard
      })
    });
    setSending(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the hook.");
      return;
    }
    setDone(true);
    if (data.matched) router.push(`/chat/${data.matched}`);
    else router.refresh();
  }

  if (done) {
    return (
      <div className="mt-14 card-line p-8">
        <p className="serif italic text-2xl">Line's out.</p>
        <p className="mt-3 text-muted text-sm">We'll let you know if they hook back.</p>
      </div>
    );
  }

  return (
    <div className="mt-14 space-y-10">
      <section className="space-y-6">
        {photos.map((p) => (
          <div key={p.id} className={target?.kind === "photo" && target.id === p.id ? "ring-1 ring-ink" : ""}>
            <PhotoCard url={p.url} alt="" hookable onHook={() => setTarget({ kind: "photo", id: p.id })} />
          </div>
        ))}
        {userPrompts.map((up) => (
          <div key={up.id} className={target?.kind === "prompt" && target.id === up.id ? "ring-1 ring-ink" : ""}>
            <PromptBlock
              question={up.question}
              answer={up.answer}
              hookable
              onHook={() => setTarget({ kind: "prompt", id: up.id })}
            />
          </div>
        ))}
      </section>

      <div className="card-line p-7 space-y-5">
        <p className="eyebrow">Shoot your shot</p>
        {!target && (
          <p className="text-muted text-sm">Pick a photo or prompt above to hook on, or hook the profile as a whole.</p>
        )}
        {target && (
          <p className="text-sm">
            Hooking <span className="serif italic">
              {target.kind === "photo" ? "this photo" : target.kind === "prompt" ? "this answer" : "this profile"}
            </span>.
          </p>
        )}
        <Textarea
          placeholder="Add a note (optional). 200 chars."
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <label className="flex items-center gap-3 text-sm text-muted">
          <input type="checkbox" checked={hard} onChange={(e) => setHard(e.target.checked)} className="accent-ink" />
          Send as a hard hook (priority — paid feature)
        </label>
        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <button onClick={() => setTarget({ kind: "profile" })} className="btn-quiet">Hook the profile</button>
          <Button onClick={send} disabled={!target || sending}>
            {sending ? "Sending…" : "Hook"}
          </Button>
        </div>
        {error && <p className="text-sm text-ink border-l border-ink pl-3">{error}</p>}
      </div>
    </div>
  );
}
