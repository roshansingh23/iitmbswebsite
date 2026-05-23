import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { ChatRoom } from "./room";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const conv = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      userA: { select: { id: true, name: true } },
      userB: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 }
    }
  });
  if (!conv) notFound();
  if (conv.userAId !== me.id && conv.userBId !== me.id) notFound();

  const other = conv.userAId === me.id ? conv.userB : conv.userA;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-8">
        <header className="border-b border-hairline pb-6">
          <p className="eyebrow">Hooked</p>
          <h1 className="display text-4xl mt-2">{other.name ?? "—"}</h1>
        </header>

        <ChatRoom
          conversationId={conv.id}
          meId={me.id}
          otherName={other.name ?? "—"}
          initialMessages={conv.messages.map((m) => ({
            id: m.id, body: m.body, fromUserId: m.fromUserId, createdAt: m.createdAt.toISOString()
          }))}
          initialLocked={conv.locked}
          initialInteractionSeconds={conv.interactionSeconds}
          capSeconds={conv.capSeconds}
        />
      </div>
    </AppShell>
  );
}
