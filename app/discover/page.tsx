import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { gendersIWant } from "@/lib/matching";
import { AppShell } from "@/components/app-shell";
import { PromptBlock } from "@/components/prompt-block";
import { PhotoCard } from "@/components/photo-card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.gender || !me.orientation || me.showMe.length === 0) redirect("/onboarding");

  const wantGenders = gendersIWant(me.orientation, me.gender, me.showMe);

  // DB-driven filtering — wrap so a broken connection doesn't 500 the page.
  let candidates: any[] = [];
  let dbError = false;
  try {
    const blocked = await db.block.findMany({
      where: { OR: [{ fromUserId: me.id }, { toUserId: me.id }] },
      select: { fromUserId: true, toUserId: true }
    });
    const blockIds = new Set([
      ...blocked.map((b) => b.fromUserId),
      ...blocked.map((b) => b.toUserId)
    ]);
    blockIds.delete(me.id);

    candidates = await db.user.findMany({
      where: {
        id: { not: me.id, notIn: Array.from(blockIds) },
        paused: false,
        gender: { in: wantGenders },
        showMe: { has: me.gender },
        photos: { some: {} },
        userPrompts: { some: {} }
      },
      include: {
        photos: { orderBy: { position: "asc" }, take: 1 },
        userPrompts: { include: { prompt: true }, orderBy: { position: "asc" }, take: 1 }
      },
      orderBy: [
        { foundingMember: "desc" },
        { lastSeenAt: "desc" },
        { createdAt: "desc" }
      ],
      take: 24
    });
  } catch (e) {
    console.error("discover query failed:", e);
    dbError = true;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-10 pb-24">
        <p className="eyebrow">People you vibe with</p>
        <h1 className="display text-5xl mt-3">For you, this week.</h1>

        {dbError ? (
          <div className="mt-14 card-line p-10">
            <p className="display text-2xl">Couldn't load profiles.</p>
            <p className="mt-3 text-muted text-sm">
              Refresh in a moment. If it keeps failing, the deployment's database
              connection is misconfigured.
            </p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-14 card-line p-10">
            <p className="display text-2xl">No fresh faces today.</p>
            <p className="mt-3 text-muted text-sm">Come back tomorrow — we shuffle the deck daily.</p>
          </div>
        ) : (
          <ul className="mt-12 space-y-12">
            {candidates.map((c) => {
              const photo = c.photos[0];
              const up = c.userPrompts[0];
              return (
                <li key={c.id} className="space-y-5">
                  <header className="flex items-baseline justify-between gap-4">
                    <Link href={`/profile/${c.id}`}>
                      <h2 className="display text-3xl">{c.name ?? "—"}</h2>
                    </Link>
                    <div className="flex items-center gap-2">
                      {c.verified && <Badge>Verified</Badge>}
                      {c.foundingMember && <Badge>Founding</Badge>}
                      {c.age && <span className="text-sm text-muted">{c.age}</span>}
                    </div>
                  </header>
                  {photo && <PhotoCard url={photo.url} alt={c.name ?? ""} />}
                  {up && <PromptBlock question={up.prompt.text} answer={up.answer} />}
                  <div className="pt-3">
                    <Link href={`/profile/${c.id}`} className="btn-line">Open profile</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
