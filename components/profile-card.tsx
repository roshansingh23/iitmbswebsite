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

// One full-bleed profile in the discover feed. Photos and prompts interleave,
// each with its own Hook button. Pass / Next controls live at the bottom.
export function ProfileCard({ candidate }: { candidate: Candidate }) {
  const [hooked, setHooked] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);

  async function hook(target:
    | { kind: "photo"; id: string }
    | { kind: "prompt"; id: string }
    | { kind: "profile" }
  ) {
    setHooked(target.kind === "profile" ? "profile" : target.id);
    try {
      const res = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: candidate.id,
          targetType: target.kind,
          targetId: target.kind === "profile" ? null : target.id,
          note: null,
          isHardHook: false
        })
      });
      if (!res.ok) {
        setHooked(null);
      }
    } catch {
      setHooked(null);
    }
  }

  if (passed) {
    return (
      <div className="card-line p-6 text-center text-sm text-muted">
        Passed on {candidate.name ?? "this profile"}.
      </div>
    );
  }

  // Interleave photos and prompts: P0, Q1, P1, Q2, P2, Q3, P3 ...
  const blocks: ({ kind: "photo"; photo: Photo } | { kind: "prompt"; up: UserPrompt })[] = [];
  const photos = candidate.photos;
  const prompts = candidate.userPrompts;
  blocks.push({ kind: "photo", photo: photos[0] });
  for (let i = 0; i < Math.max(prompts.length, photos.length - 1); i++) {
    if (prompts[i]) blocks.push({ kind: "prompt", up: prompts[i] });
    if (photos[i + 1]) blocks.push({ kind: "photo", photo: photos[i + 1] });
  }

  return (
    <article>
      {/* Header */}
      <header className="flex items-baseline justify-between mb-4 px-1">
        <div className="flex items-baseline gap-2">
          <h2 className="font-extrabold text-3xl tracking-[-0.03em]">{candidate.name ?? "—"}</h2>
          {candidate.verified && <VerifiedDot />}
        </div>
        <span className="text-sm text-muted">{candidate.age ?? ""}</span>
      </header>

      <div className="space-y-4">
        {blocks.map((b, i) =>
          b.kind === "photo" ? (
            <PhotoBlock
              key={`p${b.photo.id}`}
              photo={b.photo}
              hooked={hooked === b.photo.id}
              onHook={() => hook({ kind: "photo", id: b.photo.id })}
              alt={candidate.name ?? ""}
            />
          ) : (
            <PromptCard
              key={`q${b.up.id}`}
              up={b.up}
              hooked={hooked === b.up.id}
              onHook={() => hook({ kind: "prompt", id: b.up.id })}
            />
          )
        )}

        {/* Info card */}
        <InfoCard
          age={candidate.age}
          gender={candidate.gender}
          orientation={candidate.orientation}
          bio={candidate.bio}
        />
      </div>

      {/* Pass / Hook profile */}
      <div className="mt-6 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setPassed(true)}
          className="w-12 h-12 rounded-full border border-hairline bg-white flex items-center justify-center hover:bg-tint transition"
          aria-label="Pass"
        >
          <CrossIcon />
        </button>
        <button
          type="button"
          onClick={() => hook({ kind: "profile" })}
          disabled={hooked === "profile"}
          className="px-6 py-3 rounded-full bg-ink text-white text-sm font-semibold tracking-[0.04em] disabled:opacity-60"
        >
          {hooked === "profile" ? "Line's out" : "Hook profile"}
        </button>
      </div>
    </article>
  );
}

function PhotoBlock({
  photo, hooked, onHook, alt
}: { photo: Photo; hooked: boolean; onHook: () => void; alt: string }) {
  return (
    <figure className="relative rounded-2xl overflow-hidden border border-hairline">
      <div className="relative aspect-[4/5] bg-tint">
        <Image
          src={photo.url}
          alt={alt}
          fill
          sizes="(min-width:768px) 600px, 100vw"
          className="object-cover"
        />
      </div>
      <HookFab hooked={hooked} onHook={onHook} />
    </figure>
  );
}

function PromptCard({
  up, hooked, onHook
}: { up: UserPrompt; hooked: boolean; onHook: () => void }) {
  return (
    <article className="relative card-line p-6 pb-12">
      <p className="text-sm text-muted">{up.prompt.text}</p>
      <p className="mt-3 font-semibold text-2xl leading-snug tracking-[-0.01em]">{up.answer}</p>
      <HookFab hooked={hooked} onHook={onHook} />
    </article>
  );
}

function HookFab({ hooked, onHook }: { hooked: boolean; onHook: () => void }) {
  return (
    <button
      type="button"
      onClick={onHook}
      disabled={hooked}
      aria-label={hooked ? "Hooked" : "Hook"}
      className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-white shadow-soft border border-hairline flex items-center justify-center transition hover:scale-105 disabled:scale-100"
    >
      {hooked ? <HeartFilledIcon /> : <HeartIcon />}
    </button>
  );
}

function InfoCard({
  age, gender, orientation, bio
}: {
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
}) {
  return (
    <div className="card-line p-5">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <InfoCell label={age ? String(age) : "—"} icon={<AgeIcon />} />
        <InfoCell label={gender ? GENDER_LABEL[gender] ?? gender : "—"} icon={<PersonIcon />} />
        <InfoCell label={orientation ? ORIENTATION_LABEL[orientation] ?? orientation : "—"} icon={<HeartLineIcon />} />
      </div>
      {bio && (
        <>
          <hr className="my-4 border-hairline" />
          <p className="text-sm leading-relaxed text-ink/85">{bio}</p>
        </>
      )}
    </div>
  );
}

function InfoCell({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-ink/70">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function VerifiedDot() {
  return (
    <span title="Verified" className="inline-block w-2 h-2 rounded-full bg-ink translate-y-[-2px]" />
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function AgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function HeartLineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
