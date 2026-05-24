import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

type Row = {
  hookId: string;
  otherId: string;
  otherName: string | null;
  otherPhoto: string | null;
  conversationId: string | null;
  createdAt: string;
};

export default async function HooksPage({ searchParams }: { searchParams: { tab?: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const tab = searchParams.tab === "sent" ? "sent" : "matched";

  let sent: Row[] = [];
  let matched: Row[] = [];
  let dbError = false;

  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      // Outgoing hooks
      const { data: out } = await admin
        .from("Hook")
        .select("id,toUserId,createdAt, toUser:User!Hook_toUserId_fkey(id,name)")
        .eq("fromUserId", me.id)
        .order("createdAt", { ascending: false });
      const outgoing = (out ?? []) as any[];
      const targetIds = outgoing.map((r) => r.toUserId);

      // Reverse hooks (who hooked me back)
      let reverseSet = new Set<string>();
      if (targetIds.length > 0) {
        const { data: rev } = await admin
          .from("Hook")
          .select("fromUserId")
          .eq("toUserId", me.id)
          .in("fromUserId", targetIds);
        reverseSet = new Set((rev ?? []).map((r: any) => r.fromUserId));
      }

      // Photos for every other user in one batch
      const photosByUser: Record<string, string> = {};
      if (targetIds.length > 0) {
        const { data: photos } = await admin
          .from("Photo")
          .select("userId,url,position")
          .in("userId", targetIds)
          .order("position", { ascending: true });
        for (const p of (photos ?? []) as any[]) {
          if (!photosByUser[p.userId]) photosByUser[p.userId] = p.url;
        }
      }

      // Conversations involving me — build other→convId map
      const convByOther = new Map<string, string>();
      const { data: convs } = await admin
        .from("Conversation")
        .select("id,userAId,userBId")
        .or(`userAId.eq.${me.id},userBId.eq.${me.id}`);
      (convs ?? []).forEach((c: any) => {
        const other = c.userAId === me.id ? c.userBId : c.userAId;
        convByOther.set(other, c.id);
      });

      const buildRow = (r: any): Row => ({
        hookId: r.id,
        otherId: r.toUserId,
        otherName: r.toUser?.name ?? null,
        otherPhoto: photosByUser[r.toUserId] ?? null,
        conversationId: convByOther.get(r.toUserId) ?? null,
        createdAt: r.createdAt
      });

      matched = outgoing.filter((r) => reverseSet.has(r.toUserId)).map(buildRow);
      sent = outgoing.filter((r) => !reverseSet.has(r.toUserId)).map(buildRow);
    } catch (e) {
      console.error("hooks query failed:", e);
      dbError = true;
    }
  }

  const list = tab === "matched" ? matched : sent;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        {/* Equal-half capsules — single row */}
        <div className="grid grid-cols-2 gap-3">
          <Chip href="/hooks?tab=matched" label="Matched" active={tab === "matched"} />
          <Chip href="/hooks?tab=sent" label="Request sent" active={tab === "sent"} />
        </div>

        {dbError ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load.</p>
          </div>
        ) : list.length === 0 ? (
          <EmptyArtifact />
        ) : (
          <ul className="mt-6 space-y-3">
            {list.map((r) => (
              <li key={r.hookId}>
                <Row row={r} matched={tab === "matched"} />
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
        "flex items-center justify-center px-4 py-2.5 rounded-full text-[0.9rem] font-semibold border transition active:scale-[0.97] " +
        (active ? "bg-ink text-white border-ink" : "border-hairline text-ink hover:bg-tint")
      }
    >
      {label}
    </Link>
  );
}

function Row({ row, matched }: { row: Row; matched: boolean }) {
  return (
    <div className="card-line flex items-center gap-3 p-3">
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-tint shrink-0">
        {row.otherPhoto && (
          <Image src={row.otherPhoto} alt="" fill className="object-cover" sizes="56px" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base truncate">{row.otherName ?? "—"}</p>
      </div>
      {matched && row.conversationId ? (
        <Link
          href={`/chat/${row.conversationId}`}
          aria-label="Chat"
          className="shrink-0 w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center transition active:scale-95"
        >
          <MessageSquareText size={18} strokeWidth={2} />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyArtifact() {
  return (
    <div className="mt-14 flex flex-col items-center">
      <SeatedFigure />
    </div>
  );
}

function SeatedFigure() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" aria-hidden>
      <ellipse cx="100" cy="186" rx="68" ry="4" fill="#1C1B19" opacity="0.08" />
      <line x1="138" y1="56" x2="138" y2="124" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="138" y1="64" x2="148" y2="64" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="76" x2="148" y2="76" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="88" x2="148" y2="88" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="138" y1="100" x2="148" y2="100" stroke="#1C1B19" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="78" y1="124" x2="146" y2="124" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="86" y1="124" x2="82" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="138" y1="124" x2="142" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="106" cy="58" r="13" fill="white" stroke="#1C1B19" strokeWidth="2.5" />
      <path d="M 106 71 Q 96 86 96 110 Q 96 120 108 124" fill="none" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 104 96 Q 92 108 92 124" fill="none" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 102 77 Q 90 70 92 60" fill="none" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 108 124 Q 84 138 78 172" fill="none" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 108 124 Q 96 150 100 172" fill="none" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="172" x2="62" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="96" y1="172" x2="84" y2="172" stroke="#1C1B19" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
