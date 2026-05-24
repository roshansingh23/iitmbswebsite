import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ChatRoom } from "./room";

export const dynamic = "force-dynamic";

// Chat page uses its own layout — NO AppShell. We want a chat-focused
// surface with a fixed top header and a fixed bottom input, neither
// scrolling away. Bottom tab nav is hidden inside the conversation so
// the input can sit flush above the safe-area.

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

  // One starter prompt from the other user — used as an icebreaker artifact
  // when the conversation is empty.
  const { data: starter } = await admin
    .from("UserPrompt")
    .select("answer, prompt:Prompt(text)")
    .eq("userId", other?.id ?? "")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: messages } = await admin
    .from("Message")
    .select("id,body,fromUserId,createdAt")
    .eq("conversationId", params.id)
    .order("createdAt", { ascending: true })
    .limit(200);

  return (
    <ChatRoom
      conversationId={(conv as any).id}
      meId={me.id}
      otherUserId={other?.id ?? ""}
      otherName={other?.name ?? "—"}
      otherVerified={!!other?.verified}
      icebreaker={
        starter
          ? {
              question: (starter as any).prompt?.text ?? "",
              answer: (starter as any).answer ?? ""
            }
          : null
      }
      initialMessages={(messages ?? []).map((m: any) => ({
        id: m.id,
        body: m.body,
        fromUserId: m.fromUserId,
        createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString()
      }))}
      initialLocked={(conv as any).locked}
    />
  );
}
