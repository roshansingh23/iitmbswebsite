import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ProfileHookActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const u = await db.user.findUnique({
    where: { id: params.id },
    include: {
      photos: { orderBy: { position: "asc" } },
      userPrompts: { include: { prompt: true }, orderBy: { position: "asc" } }
    }
  });
  if (!u || u.paused) notFound();

  // Shared overlaps — "two of us" copy. Compare prompts answered by both.
  const overlap = (await db.userPrompt.findMany({
    where: { userId: me.id, promptId: { in: u.userPrompts.map((p) => p.promptId) } },
    include: { prompt: true }
  })).map((p) => p.prompt.text);

  // Trust signals — never raw counts.
  const recent = u.lastSeenAt && (Date.now() - u.lastSeenAt.getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Has the viewer already hooked them?
  const alreadyHooked = await db.hook.findFirst({
    where: { fromUserId: me.id, toUserId: u.id },
    select: { id: true }
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 lg:px-10 py-12">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="display text-6xl">{u.name ?? "—"}</h1>
            <p className="mt-2 text-muted text-sm">
              {u.age ? `${u.age}` : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {u.verified && <Badge>Verified</Badge>}
            {recent && <Badge>Active this week</Badge>}
            {u.foundingMember && <Badge>Founding</Badge>}
          </div>
        </header>

        {overlap.length > 0 && (
          <p className="mt-6 text-muted text-sm border-l border-ink pl-3">
            Two of us answered <span className="serif italic text-ink">"{overlap[0]}"</span>.
          </p>
        )}

        {u.bio && <p className="mt-10 prompt-a max-w-prose2">{u.bio}</p>}

        <ProfileHookActions
          toUserId={u.id}
          alreadyHooked={Boolean(alreadyHooked)}
          photos={u.photos.map((p) => ({ id: p.id, url: p.url }))}
          userPrompts={u.userPrompts.map((up) => ({
            id: up.id, question: up.prompt.text, answer: up.answer
          }))}
        />
      </div>
    </AppShell>
  );
}
