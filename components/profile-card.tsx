"use client";

import Image from "next/image";
import { useState } from "react";

type Photo = { id: string; url: string; position: number };
type Prompt = { id: string; text: string };
type UserPrompt = { id: string; answer: string; position: number; prompt: Prompt };

type Candidate = {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
  verified: boolean;
  foundingMember: boolean;
  photos: Photo[];
  userPrompts: UserPrompt[];
};

const GENDER_LABEL: Record<string, string> = {
  man: "Man",
  woman: "Woman",
  nonbinary: "Non-binary",
  other: "Other"
};

const ORIENTATION_LABEL: Record<string, string> = {
  straight: "Straight",
  gay: "Gay",
  lesbian: "Lesbian",
  bisexual: "Bisexual",
  pansexual: "Pansexual",
  asexual: "Asexual",
  other: "Other"
};

export function ProfileCard({
  candidate,
  onPass
}: {
  candidate: Candidate;
  onPass?: () => void;
}) {
  const [hooked, setHooked] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function sendHook(target:
    | { kind: "photo"; id: string }
    | { kind: "prompt"; id: string }
  ) {
    setHooked(target.id);
    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: candidate.id,
          targetType: target.kind,
          targetId: target.id,
          note: null,
          isHardHook: false
        })
      });
      if (!res.ok) setHooked(null);
    } catch {
      setHooked(null);
    }
  }

  function pass() {
    setDismissed(true);
    onPass?.();
  }

  if (dismissed) return null;

  // Interleave: photo, prompt, photo, prompt, photo, prompt …
  const photos = candidate.photos;
  const prompts = candidate.userPrompts;
  const blocks: ({ kind: "photo"; photo: Photo } | { kind: "prompt"; up: UserPrompt })[] = [];
  blocks.push({ kind: "photo", photo: photos[0] });
  // Info card goes right after first photo
  for (let i = 0; i < Math.max(prompts.length, photos.length - 1); i++) {
    if (prompts[i]) blocks.push({ kind: "prompt", up: prompts[i] });
    if (photos[i + 1]) blocks.push({ kind: "photo", photo: photos[i + 1] });
  }

  return (
    <article>
      <header className="mb-3 px-1 flex items-baseline justify-between">
        <h2 className="font-extrabold text-3xl tracking-[-0.03em]">{candidate.name ?? "—"}</h2>
        <span className="text-sm text-muted">{candidate.age ?? ""}</span>
      </header>

      <div className="space-y-3">
        <PhotoBlock
          photo={blocks[0].kind === "photo" ? blocks[0].photo : photos[0]}
          alt={candidate.name ?? ""}
          hooked={hooked === photos[0]?.id}
          onHook={() => photos[0] && sendHook({ kind: "photo", id: photos[0].id })}
          onPass={pass}
        />

        <InfoCard
          age={candidate.age}
          gender={candidate.gender}
          orientation={candidate.orientation}
          bio={candidate.bio}
        />

        {blocks.slice(1).map((b, i) =>
          b.kind === "photo" ? (
            <PhotoBlock
              key={`p${b.photo.id}`}
              photo={b.photo}
              alt={candidate.name ?? ""}
              hooked={hooked === b.photo.id}
              onHook={() => sendHook({ kind: "photo", id: b.photo.id })}
              onPass={pass}
            />
          ) : (
            <PromptCard
              key={`q${b.up.id}`}
              up={b.up}
              hooked={hooked === b.up.id}
              onHook={() => sendHook({ kind: "prompt", id: b.up.id })}
            />
          )
        )}
      </div>
    </article>
  );
}

function PhotoBlock({
  photo, alt, hooked, onHook, onPass
}: {
  photo: Photo;
  alt: string;
  hooked: boolean;
  onHook: () => void;
  onPass: () => void;
}) {
  return (
    <figure className="relative rounded-2xl overflow-hidden border border-hairline bg-tint">
      <div className="relative aspect-[4/5]">
        <Image
          src={photo.url}
          alt={alt}
          fill
          sizes="500px"
          className="object-cover"
        />
      </div>
      <PassFab onClick={onPass} />
      <HookFab hooked={hooked} onClick={onHook} />
    </figure>
  );
}

function PromptCard({
  up, hooked, onHook
}: { up: UserPrompt; hooked: boolean; onHook: () => void }) {
  return (
    <article className="relative card-line p-6 pb-14">
      <p className="text-sm text-muted">{up.prompt.text}</p>
      <p className="mt-3 font-semibold text-2xl leading-snug tracking-[-0.01em]">{up.answer}</p>
      <HookFab hooked={hooked} onClick={onHook} />
    </article>
  );
}

function PassFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Pass"
      className="absolute bottom-3 left-3 w-12 h-12 rounded-full bg-white border border-hairline flex items-center justify-center transition hover:scale-105"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
        <path d="M6 6l12 12M6 18L18 6" />
      </svg>
    </button>
  );
}

function HookFab({ hooked, onClick }: { hooked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={hooked}
      aria-label={hooked ? "Hooked" : "Hook"}
      className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white border border-hairline flex items-center justify-center transition hover:scale-105 disabled:scale-100"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
    >
      {hooked ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Info card — Hinge-style: 3-column top row, single-column rows below
   ───────────────────────────────────────────────────────────────────────── */

function InfoCard({
  age, gender, orientation, bio
}: {
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
}) {
  const rows: { icon: React.ReactNode; label: string }[] = [];
  if (gender) rows.push({ icon: <RowPerson />, label: GENDER_LABEL[gender] ?? gender });
  if (orientation) rows.push({ icon: <RowHeart />, label: ORIENTATION_LABEL[orientation] ?? orientation });
  if (bio) rows.push({ icon: <RowNote />, label: bio });

  return (
    <div className="card-line p-5">
      <div className="grid grid-cols-3 gap-2 pb-4 border-b border-hairline">
        <TopCell icon={<RowAge />} label={age != null ? String(age) : "—"} />
        <TopCell icon={<RowRuler />} label="—" />
        <TopCell icon={<RowPin />} label="—" />
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <span className="text-ink/80">{r.icon}</span>
            <span className="font-medium">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopCell({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-ink/80">{icon}</span>
      <span className="font-medium text-sm truncate">{label}</span>
    </div>
  );
}

function RowAge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2C9 6 7 9 7 12a5 5 0 1 0 10 0c0-3-2-6-5-10z" />
    </svg>
  );
}
function RowRuler() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="18" rx="1" />
      <path d="M9 8h2M9 12h3M9 16h2" />
    </svg>
  );
}
function RowPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function RowPerson() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function RowHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function RowNote() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16M4 12h12M4 18h8" />
    </svg>
  );
}
