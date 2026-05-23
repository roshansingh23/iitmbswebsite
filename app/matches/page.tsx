import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const convs = await db.conversation.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    include: {
      userA: { select: { id: true, name: true, photos: { take: 1, orderBy: { position: "asc" } } } },
      userB: { select: { id: true, name: true, photos: { take: 1, orderBy: { position: "asc" } } } },
      messages: { take: 1, orderBy: { createdAt: "desc" } }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-12">
        <p className="eyebrow">Hooked</p>
        <h1 className="display text-5xl mt-3">Open conversations.</h1>

        {convs.length === 0 ? (
          <p className="mt-12 text-muted serif italic text-lg">No matches yet — keep hooking.</p>
        ) : (
          <ul className="mt-10 divide-y divide-hairline">
            {convs.map((c) => {
              const other = c.userAId === me.id ? c.userB : c.userA;
              const last = c.messages[0];
              return (
                <li key={c.id} className="py-6">
                  <Link href={`/chat/${c.id}`} className="flex items-baseline justify-between gap-6 group">
                    <div>
                      <h2 className="display text-2xl group-hover:opacity-70 transition">{other.name ?? "—"}</h2>
                      <p className="mt-1 text-sm text-muted line-clamp-1 max-w-md">
                        {last ? last.body : <span className="serif italic">Say something.</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted">
                      {c.locked ? "Paused" : `${Math.floor(c.interactionSeconds / 60)}m`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
