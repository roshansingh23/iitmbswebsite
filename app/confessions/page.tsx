import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { ConfessionComposer } from "./composer";
import { ConfessionReactions } from "./reactions";

export const dynamic = "force-dynamic";

type Confession = {
  id: string;
  body: string;
  createdAt: string;
  reactions: { kind: string }[];
  replies: { id: string }[];
};

export default async function ConfessionsPage({ searchParams }: { searchParams: { sort?: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const sort = searchParams.sort === "top" ? "top" : "new";

  let confessions: Confession[] = [];
  let dbError = false;
  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      const { data, error } = await admin
        .from("Confession")
        .select("id,body,createdAt,reactions:ConfessionReaction(kind),replies:ConfessionReply(id)")
        .eq("approved", true)
        .order("createdAt", { ascending: false })
        .limit(80);
      if (error) throw error;
      confessions = (data ?? []) as any;
    } catch (e) {
      console.error("confessions query failed:", e);
      dbError = true;
    }
  }

  const ordered =
    sort === "top"
      ? [...confessions].sort((a, b) => (b.reactions?.length ?? 0) - (a.reactions?.length ?? 0))
      : confessions;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Chip href="/confessions" label="New" active={sort === "new"} />
          <Chip href="/confessions?sort=top" label="Most reacted" active={sort === "top"} />
        </div>

        <ConfessionComposer />

        {dbError ? (
          <div className="card-line p-5 mt-4">
            <p className="font-semibold">Couldn't load.</p>
          </div>
        ) : ordered.length === 0 ? (
          <EmptyArtifact />
        ) : (
          <ul className="mt-4 space-y-3">
            {ordered.map((c) => (
              <li key={c.id} className="card-line p-5">
                <p className="leading-relaxed">{c.body}</p>
                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-3">
                  <ConfessionReactions
                    confessionId={c.id}
                    initial={countByKind(c.reactions ?? [])}
                  />
                  <Link href={`/confessions/${c.id}`} className="text-xs underline text-muted">
                    {(c.replies ?? []).length} {(c.replies ?? []).length === 1 ? "reply" : "replies"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        "shrink-0 px-4 py-2 rounded-full text-[0.85rem] font-medium border transition " +
        (active ? "bg-ink text-white border-ink" : "border-hairline text-ink hover:bg-tint")
      }
    >
      {label}
    </Link>
  );
}

function EmptyArtifact() {
  return (
    <div className="mt-10 flex flex-col items-center text-center pb-8">
      <SpilledTea />
      <p className="mt-6 font-extrabold text-2xl tracking-[-0.03em]">No tea yet.</p>
    </div>
  );
}

// A tipped teacup with a single curved stream pouring out into a small
// puddle. Hand-tuned coordinates, monochrome strokes, no library art —
// fits the "spill the tea" idea literally.
function SpilledTea() {
  return (
    <svg
      width="156"
      height="156"
      viewBox="0 0 156 156"
      fill="none"
      aria-hidden
    >
      {/* saucer */}
      <ellipse cx="56" cy="138" rx="36" ry="5" fill="#1C1B19" opacity="0.08" />
      <ellipse
        cx="56"
        cy="135"
        rx="32"
        ry="3"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="1.4"
      />

      {/* splash droplets near the puddle */}
      <circle cx="20" cy="130" r="2" fill="#1C1B19" />
      <circle cx="92" cy="128" r="2.2" fill="#1C1B19" />
      <path
        d="M 28 124 q 2 -3 4 0"
        stroke="#1C1B19"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 84 122 q 2 -3 4 0"
        stroke="#1C1B19"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* puddle of tea on the saucer */}
      <ellipse cx="56" cy="132" rx="24" ry="3" fill="#1C1B19" />

      {/* falling tea stream — curved from cup rim down to puddle */}
      <path
        d="M 78 58 C 70 78 60 100 56 128"
        stroke="#1C1B19"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* teacup — tipped ~40 degrees to the right */}
      <g transform="rotate(38 100 56)">
        {/* cup body */}
        <path
          d="M 78 26 L 78 64 Q 78 72 86 72 L 114 72 Q 122 72 122 64 L 122 26 Z"
          fill="white"
          stroke="#1C1B19"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* tea inside cup (visible at the angled rim) */}
        <path
          d="M 78 26 Q 80 34 86 34 L 114 34 Q 120 34 122 26 Z"
          fill="#1C1B19"
        />
        {/* rim ellipse */}
        <ellipse
          cx="100"
          cy="26"
          rx="22"
          ry="4"
          fill="white"
          stroke="#1C1B19"
          strokeWidth="2"
        />
        {/* handle */}
        <path
          d="M 122 36 Q 138 40 138 52 Q 138 62 122 62"
          fill="none"
          stroke="#1C1B19"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* a small steam wisp above (calls back to the rest state) */}
      <path
        d="M 96 16 q 4 -6 0 -12"
        stroke="#1C1B19"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function countByKind(reactions: { kind: string }[]) {
  const out: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of reactions) out[r.kind] = (out[r.kind] ?? 0) + 1;
  return out;
}
