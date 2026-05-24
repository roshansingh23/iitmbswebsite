import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

type Conv = {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
  locked: boolean;
  interactionSeconds: number;
  userA: { id: string; name: string | null };
  userB: { id: string; name: string | null };
  messages: { body: string }[];
};

export default async function MatchesPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  let convs: Conv[] = [];
  let dbError = false;
  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      const { data, error } = await admin
        .from("Conversation")
        .select(
          "id,userAId,userBId,updatedAt,locked,interactionSeconds," +
          "userA:User!Conversation_userAId_fkey(id,name)," +
          "userB:User!Conversation_userBId_fkey(id,name)," +
          "messages:Message(body)"
        )
        .or(`userAId.eq.${me.id},userBId.eq.${me.id}`)
        .order("updatedAt", { ascending: false });
      if (error) throw error;
      convs = (data ?? []) as any;
    } catch (e) {
      console.error("matches query failed:", e);
      dbError = true;
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-12">
        <h1 className="font-extrabold text-2xl tracking-[-0.04em]">Chats</h1>

        {dbError ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load chats.</p>
          </div>
        ) : convs.length === 0 ? (
          <p className="mt-8 text-muted text-sm">No matches yet — keep hooking.</p>
        ) : (
          <ul className="mt-6 divide-y divide-hairline">
            {convs.map((c) => {
              const other = c.userAId === me.id ? c.userB : c.userA;
              const last = (c.messages ?? [])[0];
              return (
                <li key={c.id} className="py-4">
                  <Link href={`/chat/${c.id}`} className="flex items-baseline justify-between gap-6 group">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-lg group-hover:opacity-70 transition">{other?.name ?? "—"}</h2>
                      <p className="mt-1 text-sm text-muted line-clamp-1">
                        {last ? last.body : "Say something."}
                      </p>
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
