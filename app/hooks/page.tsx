import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HooksPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  // Incoming hooks the viewer can act on.
  // Insights-tier users see WHO hooked them; free tier sees a count cue only.
  const incoming = await db.hook.findMany({
    where: { toUserId: me.id },
    include: { fromUser: { include: { photos: { take: 1, orderBy: { position: "asc" } } } } },
    orderBy: [{ isHardHook: "desc" }, { createdAt: "desc" }]
  });

  const outgoing = await db.hook.findMany({
    where: { fromUserId: me.id },
    include: { toUser: { include: { photos: { take: 1, orderBy: { position: "asc" } } } } },
    orderBy: { createdAt: "desc" }
  });

  const canSeeIncoming = me.accessTier === "insights" || me.accessTier === "plus";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-12">
        <p className="eyebrow">Your hooks</p>
        <h1 className="display text-5xl mt-3">Lines in & out.</h1>

        <section className="mt-14">
          <header className="flex items-baseline justify-between">
            <h2 className="display text-3xl">Hooked you</h2>
            <span className="text-xs text-muted">{incoming.length}</span>
          </header>

          {incoming.length === 0 ? (
            <p className="mt-6 text-muted serif italic text-lg">No hooks yet — go shoot your shot.</p>
          ) : !canSeeIncoming ? (
            <div className="mt-6 card-line p-7">
              <p className="serif italic text-2xl">
                {incoming.length} {incoming.length === 1 ? "person has" : "people have"} hooked you.
              </p>
              <p className="mt-3 text-muted text-sm">
                Upgrade to Insights to see who they are and prioritise your replies.
              </p>
              <Link href="/upgrade" className="btn-ink mt-6 inline-flex">Upgrade</Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-6">
              {incoming.map((h) => (
                <li key={h.id} className="card-line p-6 flex items-center justify-between gap-6">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <Link href={`/profile/${h.fromUser.id}`} className="display text-2xl">
                        {h.fromUser.name ?? "—"}
                      </Link>
                      {h.isHardHook && <Badge>Hard hook</Badge>}
                    </div>
                    {h.note && (
                      <p className="mt-3 prompt-a serif italic text-ink/90 max-w-md">"{h.note}"</p>
                    )}
                  </div>
                  <Link href={`/profile/${h.fromUser.id}`} className="btn-line">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-20">
          <header className="flex items-baseline justify-between">
            <h2 className="display text-3xl">Lines out</h2>
            <span className="text-xs text-muted">{outgoing.length}</span>
          </header>
          {outgoing.length === 0 ? (
            <p className="mt-6 text-muted serif italic text-lg">Nothing yet.</p>
          ) : (
            <ul className="mt-8 space-y-4">
              {outgoing.map((h) => (
                <li key={h.id} className="flex items-center justify-between border-b border-hairline pb-3">
                  <Link href={`/profile/${h.toUser.id}`} className="text-lg">
                    {h.toUser.name ?? "—"}
                  </Link>
                  <span className="text-xs text-muted">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
