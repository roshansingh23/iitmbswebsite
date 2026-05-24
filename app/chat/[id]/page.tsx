import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { ChatRoom } from "./room";

export const dynamic = "force-dynamic";

// Define "active right now" as activity within the last 15 minutes.
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export default async function ChatPage({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const admin = supabaseAdmin();
  if (!admin) notFound();

  const { data: conv } = await admin
    .from("Conversation")
    .select(
      "id,userAId,userBId,locked,interactionSeconds,capSeconds," +
      "userA:User!Conversation_userAId_fkey(id,name,verified,lastSeenAt)," +
      "userB:User!Conversation_userBId_fkey(id,name,verified,lastSeenAt)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();
  if ((conv as any).userAId !== me.id && (conv as any).userBId !== me.id) notFound();

  const other = (conv as any).userAId === me.id ? (conv as any).userB : (conv as any).userA;

  // First photo for the header avatar
  let otherPhoto: string | null = null;
  if (other?.id) {
    const { data: ph } = await admin
      .from("Photo")
      .select("url,position")
      .eq("userId", other.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (ph) otherPhoto = (ph as any).url;
  }

  const otherActive =
    other?.lastSeenAt
      ? Date.now() - new Date(other.lastSeenAt).getTime() < ACTIVE_WINDOW_MS
      : false;

  const { data: messages } = await admin
    .from("Message")
    .select("id,body,fromUserId,createdAt,messageType,photoUrl,viewsRemaining")
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
        otherActive={otherActive}
        otherPhoto={otherPhoto}
        initialMessages={(messages ?? []).map((m: any) => ({
          id: m.id,
          body: m.body,
          fromUserId: m.fromUserId,
          messageType: m.messageType ?? "text",
          // Hide the URL from recipients — they have to spend a view to see it.
          photoUrl: m.fromUserId === me.id ? (m.photoUrl ?? null) : null,
          viewsRemaining: m.viewsRemaining ?? null,
          createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString()
        }))}
        initialLocked={(conv as any).locked}
      />
    </AppShell>
  );
}
