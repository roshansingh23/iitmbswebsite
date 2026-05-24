import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { ChatRoom } from "./room";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const admin = supabaseAdmin();
  if (!admin) notFound();

  const { data: conv } = await admin
    .from("Conversation")
    .select(
      "id,userAId,userBId,locked,interactionSeconds,capSeconds," +
      "userA:User!Conversation_userAId_fkey(id,name)," +
      "userB:User!Conversation_userBId_fkey(id,name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();
  if ((conv as any).userAId !== me.id && (conv as any).userBId !== me.id) notFound();

  const { data: messages } = await admin
    .from("Message")
    .select("id,body,fromUserId,createdAt")
    .eq("conversationId", params.id)
    .order("createdAt", { ascending: true })
    .limit(200);

  const other = (conv as any).userAId === me.id ? (conv as any).userB : (conv as any).userA;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        <header className="border-b border-hairline pb-3">
          <h1 className="font-extrabold text-2xl tracking-[-0.03em]">{other?.name ?? "—"}</h1>
        </header>

        <ChatRoom
          conversationId={(conv as any).id}
          meId={me.id}
          otherName={other?.name ?? "—"}
          initialMessages={(messages ?? []).map((m: any) => ({
            id: m.id, body: m.body, fromUserId: m.fromUserId,
            createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString()
          }))}
        />
      </div>
    </AppShell>
  );
}
