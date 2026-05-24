import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { thumb } from "@/lib/cloudinary-thumb";

export const dynamic = "force-dynamic";

type Conv = {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
  userA: { id: string; name: string | null; verified: boolean };
  userB: { id: string; name: string | null; verified: boolean };
  messages: { body: string; createdAt: string }[];
};

export default async function MatchesPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  let convs: Conv[] = [];
  let photosByUser: Record<string, string> = {};
  let dbError = false;
  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      // Only matched (mutual) conversations appear in Chats. One-way
      // requests live in /hooks?tab=sent until the other side hooks back.
      const { data, error } = await admin
        .from("Conversation")
        .select(
          "id,userAId,userBId,updatedAt," +
          "userA:User!Conversation_userAId_fkey(id,name,verified)," +
          "userB:User!Conversation_userBId_fkey(id,name,verified)," +
          "messages:Message(body,createdAt)"
        )
        .or(`userAId.eq.${me.id},userBId.eq.${me.id}`)
        .not("matchId", "is", null)
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      convs = (data ?? []) as any;

      // Latest message first
      convs.forEach((c) => {
        c.messages = [...(c.messages ?? [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Fetch the first photo for every "other" user in one query
      const otherIds = convs.map((c) => (c.userAId === me.id ? c.userBId : c.userAId));
      if (otherIds.length > 0) {
        const { data: photos } = await admin
          .from("Photo")
          .select("userId,url,position")
          .in("userId", otherIds)
          .order("position", { ascending: true });
        for (const p of (photos ?? []) as any[]) {
          if (!photosByUser[p.userId]) photosByUser[p.userId] = p.url;
        }
      }
    } catch (e) {
      console.error("matches query failed:", e);
      dbError = true;
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        {dbError ? (
          <div className="card-line p-5 mt-2">
            <p className="font-semibold">Couldn't load chats.</p>
          </div>
        ) : convs.length === 0 ? (
          <div className="card-line p-5 mt-2">
            <p className="font-semibold">No chats yet.</p>
            <p className="mt-1 text-muted text-sm">Hook someone on Discover and they show up here.</p>
          </div>
        ) : (
          <ul className="space-y-3 mt-2">
            {convs.map((c) => {
              const other = c.userAId === me.id ? c.userB : c.userA;
              const otherId = c.userAId === me.id ? c.userBId : c.userAId;
              const last = c.messages[0];
              const photo = photosByUser[otherId];
              return (
                <li key={c.id}>
                  <Link
                    href={`/chat/${c.id}`}
                    className="card-line flex items-center gap-3 p-3 active:bg-tint transition"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-tint shrink-0">
                      {photo && (
                        <Image src={thumb(photo, 150)} alt="" fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-base truncate">{other?.name ?? "—"}</p>
                        {other?.verified && (
                          <BadgeCheck
                            size={16}
                            strokeWidth={2}
                            style={{ color: "#D43A2F", fill: "transparent" }}
                            aria-label="Verified"
                          />
                        )}
                      </div>
                      {last && (
                        <p className="mt-0.5 text-sm text-muted line-clamp-1">{last.body}</p>
                      )}
                    </div>
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
