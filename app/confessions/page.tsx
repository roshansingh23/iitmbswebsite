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
        .select("id,body,createdAt,reactions:ConfessionReaction(kind)")
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
                <div className="mt-4 pt-3 border-t border-hairline">
                  <ConfessionReactions
                    confessionId={c.id}
                    initial={countByKind(c.reactions ?? [])}
                  />
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

// Tipped teacup with a single curved stream pouring into a puddle.
// Coordinates were computed for a 30° clockwise rotation around the cup
// centre at (60, 50) — the stream start point matches the post-rotation
// position of the rim's lower edge so the liquid actually connects to the
// cup mouth.
function SpilledTea() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden
    >
      {/* Cup — tilted right */}
      <g transform="rotate(30 60 50)">
        {/* body */}
        <rect
          x="35"
          y="22"
          width="50"
          height="56"
          rx="4"
          fill="white"
          stroke="#1C1B19"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* rim ellipse */}
        <ellipse
          cx="60"
          cy="22"
          rx="25"
          ry="4.5"
          fill="white"
          stroke="#1C1B19"
          strokeWidth="2.5"
        />
        {/* tea visible inside at the rim */}
        <ellipse cx="60" cy="22" rx="21" ry="3" fill="#1C1B19" />
        {/* handle */}
        <path
          d="M 85 38 Q 100 42 100 52 Q 100 62 85 66"
          fill="none"
          stroke="#1C1B19"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Tea stream — starts at the post-rotation lower rim (~96, 38) */}
      <path
        d="M 96 38 C 92 62, 88 92, 88 128"
        stroke="#1C1B19"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Puddle of tea */}
      <ellipse cx="88" cy="138" rx="30" ry="4" fill="#1C1B19" />
      <ellipse
        cx="88"
        cy="140"
        rx="40"
        ry="5.5"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="1.4"
        opacity="0.35"
      />

      {/* Splash droplets */}
      <circle cx="58" cy="130" r="2" fill="#1C1B19" />
      <circle cx="120" cy="130" r="2.5" fill="#1C1B19" />
      <path
        d="M 50 124 q 2 -3 4 0"
        stroke="#1C1B19"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 124 122 q 2 -3 4 0"
        stroke="#1C1B19"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function countByKind(reactions: { kind: string }[]) {
  const out: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of reactions) out[r.kind] = (out[r.kind] ?? 0) + 1;
  return out;
}
