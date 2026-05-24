"use client";

import Image from "next/image";
import {
  User as UserIcon,
  Heart as HeartIcon,
  Ruler as RulerIcon,
  Cake as CakeIcon,
  Quote as QuoteIcon,
  Sprout as SproutIcon,
  Users as UsersIcon,
  BadgeCheck as BadgeCheckIcon
} from "lucide-react";
import { ProfileMenu } from "./profile-menu";

type Photo = { id: string; url: string; position: number };
type Prompt = { id: string; text: string };
type UserPrompt = { id: string; answer: string; position: number; prompt: Prompt };

export type Candidate = {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
  height: string | null;
  location: string | null;
  intentions: string | null;
  relationshipType: string | null;
  verified: boolean;
  foundingMember: boolean;
  photos: Photo[];
  userPrompts: UserPrompt[];
};

const GENDER_LABEL: Record<string, string> = {
  man: "Man", woman: "Woman", nonbinary: "Non-binary", other: "Other"
};
const ORIENTATION_LABEL: Record<string, string> = {
  straight: "Straight", gay: "Gay", lesbian: "Lesbian",
  bisexual: "Bisexual", pansexual: "Pansexual", asexual: "Asexual", other: "Other"
};

function buildBlocks(photos: Photo[], prompts: UserPrompt[]) {
  const blocks: ({ kind: "photo"; photo: Photo } | { kind: "prompt"; up: UserPrompt } | { kind: "details" })[] = [];
  if (photos[0]) blocks.push({ kind: "photo", photo: photos[0] });
  if (prompts[0]) blocks.push({ kind: "prompt", up: prompts[0] });
  blocks.push({ kind: "details" });

  let pi = 1;
  let qi = 1;
  while (qi < prompts.length) {
    if (photos[pi]) blocks.push({ kind: "photo", photo: photos[pi++] });
    blocks.push({ kind: "prompt", up: prompts[qi++] });
  }
  while (pi < photos.length) blocks.push({ kind: "photo", photo: photos[pi++] });

  return blocks;
}

export function ProfileCard({
  candidate,
  onRemove
}: {
  candidate: Candidate;
  onRemove: () => void;
}) {
  const blocks = buildBlocks(candidate.photos, candidate.userPrompts);

  return (
    <article>
      <header className="px-1 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="font-extrabold text-3xl tracking-[-0.03em] truncate">{candidate.name ?? "—"}</h2>
          {candidate.verified && (
            <BadgeCheckIcon
              size={22}
              strokeWidth={2}
              style={{ color: "#D43A2F", fill: "transparent" }}
              aria-label="Verified"
            />
          )}
        </div>
        <ProfileMenu
          candidateId={candidate.id}
          candidateName={candidate.name ?? "this profile"}
          onRemove={onRemove}
        />
      </header>

      <div className="space-y-3">
        {blocks.map((b, i) => {
          if (b.kind === "photo")
            return <PhotoBlock key={`p${b.photo.id}-${i}`} photo={b.photo} alt={candidate.name ?? ""} />;
          if (b.kind === "prompt") return <PromptCard key={`q${b.up.id}-${i}`} up={b.up} />;
          return <InfoCard key={`d${i}`} candidate={candidate} />;
        })}
      </div>
    </article>
  );
}

function PhotoBlock({ photo, alt }: { photo: Photo; alt: string }) {
  return (
    <figure className="rounded-2xl overflow-hidden border border-hairline bg-tint">
      <div className="relative aspect-[4/5]">
        <Image src={photo.url} alt={alt} fill sizes="500px" className="object-cover" />
      </div>
    </figure>
  );
}

function PromptCard({ up }: { up: UserPrompt }) {
  return (
    <article className="card-line p-6">
      <p className="text-sm text-muted">{up.prompt.text}</p>
      <p className="mt-3 font-semibold text-2xl leading-snug tracking-[-0.01em]">{up.answer}</p>
    </article>
  );
}

function InfoCard({ candidate }: { candidate: Candidate }) {
  const rows: { icon: React.ReactNode; label: string }[] = [];
  if (candidate.gender) rows.push({ icon: <UserIcon size={20} strokeWidth={1.75} />, label: GENDER_LABEL[candidate.gender] ?? candidate.gender });
  if (candidate.orientation) rows.push({ icon: <HeartIcon size={20} strokeWidth={1.75} />, label: ORIENTATION_LABEL[candidate.orientation] ?? candidate.orientation });
  if (candidate.intentions) rows.push({ icon: <SproutIcon size={20} strokeWidth={1.75} />, label: candidate.intentions });
  if (candidate.relationshipType) rows.push({ icon: <UsersIcon size={20} strokeWidth={1.75} />, label: candidate.relationshipType });
  if (candidate.bio) rows.push({ icon: <QuoteIcon size={20} strokeWidth={1.75} />, label: candidate.bio });

  return (
    <div className="card-line p-5">
      <div className="grid grid-cols-2 gap-3 pb-4 border-b border-hairline">
        <TopCell icon={<CakeIcon size={20} strokeWidth={1.75} />} label={candidate.age != null ? String(candidate.age) : "—"} />
        <TopCell icon={<RulerIcon size={20} strokeWidth={1.75} />} label={candidate.height ?? "—"} />
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <span className="text-ink/80 shrink-0">{r.icon}</span>
            <span className="font-medium">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopCell({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 min-w-0">
      <span className="text-ink/80 shrink-0">{icon}</span>
      <span className="font-medium text-sm truncate">{label}</span>
    </div>
  );
}
