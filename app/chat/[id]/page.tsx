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
      "userA:User!Conversation_userAId_fkey(id,name,verified)," +
      "userB:User!Conversation_userBId_fkey(id,name,verified)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();
  if ((conv as any).userAId !== me.id && (conv as any).userBId !== me.id) notFound();

  const other = (conv as any).userAId === me.id ? (conv as any).userB : (conv as any).userA;

  const { data: messages } = await admin
    .from("Message")
    .select("id,body,fromUserId,createdAt")
    .eq("conversationId", params.id)
    .order("createdAt", { ascending: true })
    .limit(200);

  return (
    <AppShell>
      <ChatRoom
        conversationId={(conv as any).id}
        meId={me.id}
        otherUserId={other?.id ?? ""}
        otherName={other?.name ?? "—"}
        otherVerified={!!other?.verified}
        initialMessages={(messages ?? []).map((m: any) => ({
          id: m.id,
          body: m.body,
          fromUserId: m.fromUserId,
          createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString()
        }))}
        initialLocked={(conv as any).locked}
      />
    </AppShell>
  );
}
