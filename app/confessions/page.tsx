import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ConfessionComposer } from "./composer";
import { ConfessionReactions } from "./reactions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConfessionsPage({ searchParams }: { searchParams: { sort?: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const sort = searchParams.sort === "top" ? "top" : "new";

  const confessions = await db.confession.findMany({
    where: { approved: true },
    include: {
      reactions: true,
      replies: { where: { approved: true }, orderBy: { createdAt: "asc" } }
    },
    orderBy: sort === "new" ? { createdAt: "desc" } : { createdAt: "desc" },
    take: 80
  });

  // For "top", sort post-query by reaction count.
  const ordered = sort === "top"
    ? [...confessions].sort((a, b) => b.reactions.length - a.reactions.length)
    : confessions;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 lg:px-10 py-12">
        <p className="eyebrow">Lowkey thoughts</p>
        <h1 className="display text-5xl mt-3">Confessions.</h1>
        <p className="mt-4 text-muted text-sm">Anonymous. We see who you are only if we have to.</p>

        <div className="mt-10 flex items-center gap-6 text-sm border-b border-hairline pb-3">
          <Link href="/confessions" className={sort === "new" ? "text-ink" : "text-muted"}>New</Link>
          <Link href="/confessions?sort=top" className={sort === "top" ? "text-ink" : "text-muted"}>Most reacted</Link>
        </div>

        <ConfessionComposer />

        <ul className="mt-10 space-y-5">
          {ordered.length === 0 && (
            <li className="card-line p-7">
              <p className="serif italic text-2xl">Quiet around here.</p>
              <p className="mt-3 text-muted text-sm">Be the first to spill.</p>
            </li>
          )}
          {ordered.map((c) => (
            <li key={c.id} className="card-line p-6">
              <p className="prompt-a">{c.body}</p>
              <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-between gap-3">
                <ConfessionReactions
                  confessionId={c.id}
                  initial={countByKind(c.reactions)}
                />
                <Link href={`/confessions/${c.id}`} className="btn-quiet">
                  {c.replies.length} {c.replies.length === 1 ? "reply" : "replies"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function countByKind(reactions: { kind: string }[]) {
  const out: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of reactions) out[r.kind] = (out[r.kind] ?? 0) + 1;
  return out;
}
