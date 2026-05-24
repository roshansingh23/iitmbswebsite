import { redirect } from "next/navigation";
import Link from "next/link";
import { Quote } from "lucide-react";
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
    <div className="mt-6 card-line p-8 flex flex-col items-center text-center bg-tint">
      <div className="w-16 h-16 rounded-full bg-white border border-hairline flex items-center justify-center">
        <Quote size={26} strokeWidth={1.75} className="text-ink" />
      </div>
      <p className="mt-5 font-semibold text-lg">Be the first to spill.</p>
    </div>
  );
}

function countByKind(reactions: { kind: string }[]) {
  const out: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of reactions) out[r.kind] = (out[r.kind] ?? 0) + 1;
  return out;
}
