import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

type HookRow = {
  id: string;
  isHardHook: boolean;
  note: string | null;
  createdAt: string;
  fromUserId: string;
  toUserId: string;
  other: { id: string; name: string | null } | null;
};

export default async function HooksPage({ searchParams }: { searchParams: { tab?: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const tab = searchParams.tab === "sent" ? "sent" : "matched";

  let sent: HookRow[] = [];
  let matched: HookRow[] = [];
  let dbError = false;

  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      const { data: out } = await admin
        .from("Hook")
        .select("id,isHardHook,note,createdAt,fromUserId,toUserId, toUser:User!Hook_toUserId_fkey(id,name)")
        .eq("fromUserId", me.id)
        .order("createdAt", { ascending: false });
      const outgoing = ((out ?? []) as any[]).map((r) => ({ ...r, other: r.toUser }));

      const targetIds = outgoing.map((r) => r.toUserId);
      let reverseSet = new Set<string>();
      if (targetIds.length > 0) {
        const { data: rev } = await admin
          .from("Hook")
          .select("fromUserId")
          .eq("toUserId", me.id)
          .in("fromUserId", targetIds);
        reverseSet = new Set((rev ?? []).map((r: any) => r.fromUserId));
      }

      matched = outgoing.filter((r) => reverseSet.has(r.toUserId));
      sent = outgoing.filter((r) => !reverseSet.has(r.toUserId));
    } catch (e) {
      console.error("hooks query failed:", e);
      dbError = true;
    }
  }

  const list = tab === "matched" ? matched : sent;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        {/* Capsule chips — one row, two filters */}
        <div className="flex items-center gap-2">
          <Chip
            href="/hooks?tab=matched"
            label={`Matched ${matched.length}`}
            active={tab === "matched"}
          />
          <Chip
            href="/hooks?tab=sent"
            label={`Request sent ${sent.length}`}
            active={tab === "sent"}
          />
        </div>

        {dbError ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load.</p>
          </div>
        ) : list.length === 0 ? (
          <EmptyArtifact />
        ) : (
          <ul className="mt-6 space-y-3">
            {list.map((h) => (
              <li key={h.id} className="card-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-base">{h.other?.name ?? "—"}</p>
                  {h.isHardHook && (
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-muted">
                      Priority
                    </span>
                  )}
                </div>
                {h.note && <p className="mt-2 text-sm text-ink/85">"{h.note}"</p>}
                <p className="mt-2 text-xs text-muted">
                  {new Date(h.createdAt).toLocaleDateString()}
                </p>
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
        "shrink-0 px-4 py-2 rounded-full text-[0.85rem] font-medium border transition active:scale-[0.97] " +
        (active ? "bg-ink text-white border-ink" : "border-hairline text-ink hover:bg-tint")
      }
    >
      {label}
    </Link>
  );
}

function EmptyArtifact() {
  return (
    <div className="mt-14 flex flex-col items-center">
      <SeatedFigure />
    </div>
  );
}

// Side-view of a person sitting on a chair, hand on chin — a "waiting"
// posture. Hand-drawn coordinates, monochrome strokes, no library art.
function SeatedFigure() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" aria-hidden>
      {/* floor shadow */}
      <ellipse cx="100" cy="186" rx="68" ry="4" fill="#1C1B19" opacity="0.08" />

      {/* chair — backrest, seat, legs */}
      <line x1="138" y1="56" x2="138" y2="124" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="138" y1="64" x2="148" y2="64" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="76" x2="148" y2="76" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="88" x2="148" y2="88" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="100" x2="148" y2="100" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />

      <line x1="78" y1="124" x2="146" y2="124" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />

      <line x1="86" y1="124" x2="82" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="138" y1="124" x2="142" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />

      {/* person — head */}
      <circle cx="106" cy="58" r="13" fill="white" stroke="#1C1B19" strokeWidth="2.5" />

      {/* torso (slightly hunched forward) */}
      <path
        d="M 106 71 Q 96 86 96 110 Q 96 120 108 124"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* arm resting on lap */}
      <path
        d="M 104 96 Q 92 108 92 124"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* other arm propping head (waiting pose) */}
      <path
        d="M 102 77 Q 90 70 92 60"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* legs — knees forward */}
      <path
        d="M 108 124 Q 84 138 78 172"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 108 124 Q 96 150 100 172"
        fill="none"
        stroke="#1C1B19"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* feet */}
      <line x1="74" y1="172" x2="62" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="96" y1="172" x2="84" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
