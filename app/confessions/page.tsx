import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { ConfessionComposer } from "./composer";
import { ConfessionReactions } from "./reactions";
import Link from "next/link";

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
      <div className="mx-auto max-w-md md:max-w-2xl px-4 sm:px-6 pt-6 pb-28">
        <h1 className="font-extrabold text-2xl tracking-[-0.04em]">Spill</h1>
        <p className="mt-2 text-muted text-sm">Anonymous. Author identity only visible to admins.</p>

        <div className="mt-6 flex items-center gap-6 text-sm border-b border-hairline pb-3">
          <Link href="/confessions" className={sort === "new" ? "text-ink font-semibold" : "text-muted"}>New</Link>
          <Link href="/confessions?sort=top" className={sort === "top" ? "text-ink font-semibold" : "text-muted"}>Most reacted</Link>
        </div>

        <ConfessionComposer />

        {dbError ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load confessions.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {ordered.length === 0 && (
              <li className="card-line p-5">
                <p className="font-semibold">Quiet around here.</p>
                <p className="mt-1 text-muted text-sm">Be the first to spill.</p>
              </li>
            )}
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

function countByKind(reactions: { kind: string }[]) {
  const out: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of reactions) out[r.kind] = (out[r.kind] ?? 0) + 1;
  return out;
}
