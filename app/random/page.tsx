import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { AnonAvatar } from "@/components/anon-avatar";
import { aliasFor, partnerIdOf, sideOf, type SessionRow } from "@/lib/random";
import { DisplayNameEditor } from "./display-name";
import { RandomConnect } from "./connect";
import { InterestPicker } from "./interests";
import { RandomPreferences } from "./preferences";

export const dynamic = "force-dynamic";

export const metadata = { title: "Random" };

export default async function RandomPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  // Kept chats — the ones this member chose to hold on to. Everything else
  // is swept by purge_random_sessions() a week after it ends.
  //
  // Each row is labelled with the partner's chosen handle, or the alias
  // generated for that session if they never picked one. Real names are not
  // read here: the projection below is displayName only.
  let kept: { id: string; name: string; startedAt: string; messageCount: number }[] = [];
  const admin = supabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from("RandomSession")
      .select("*")
      .or(
        `and(userAId.eq.${me.id},keptByA.eq.true),and(userBId.eq.${me.id},keptByB.eq.true)`
      )
      .order("startedAt", { ascending: false })
      .limit(50);

    const rows = (data ?? []) as SessionRow[];
    const partnerIds = Array.from(
      new Set(rows.map((r) => partnerIdOf(r, me.id)).filter((x): x is string => !!x))
    );

    const handles = new Map<string, string>();
    if (partnerIds.length > 0) {
      const { data: people } = await admin
        .from("User")
        .select("id,displayName")
        .in("id", partnerIds);
      for (const p of (people ?? []) as any[]) {
        const h = (p.displayName ?? "").trim();
        if (h) handles.set(p.id, h);
      }
    }

    kept = rows.flatMap((s) => {
      const side = sideOf(s, me.id);
      const partnerId = partnerIdOf(s, me.id);
      if (!side || !partnerId) return [];
      return [{
        id: s.id,
        name: handles.get(partnerId) ?? aliasFor(s.id, side === "A" ? "B" : "A"),
        startedAt: s.startedAt,
        messageCount: s.messageCount
      }];
    });
  }

  return (
    <AppShell>
      {/* The chat window is the screen. The search runs inside it, and
          everything you can set lives in the sheet that slides up. */}
      <RandomConnect hasInterests={me.interests.length > 0}>
        <RandomPreferences
          initialGender={me.randomPrefGender}
          initialWorkspace={me.randomPrefWorkspace}
        />

        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
            Interests
          </p>
          <InterestPicker current={me.interests} />
        </div>

        <div className="pt-1 border-t border-hairline">
          <div className="pt-4">
            <DisplayNameEditor current={me.displayName} />
          </div>
        </div>

        {kept.length > 0 && (
          <div className="pt-4 border-t border-hairline">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted font-semibold mb-2">
              Saved chats
            </p>
            <ul className="space-y-1">
              {kept.map((k) => (
                <li key={k.id}>
                  <Link
                    href={`/random/${k.id}`}
                    className="flex items-center gap-3 py-2 -mx-2 px-2 rounded-xl hover:bg-tint transition"
                  >
                    <AnonAvatar name={k.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm truncate">{k.name}</span>
                      <span className="block text-xs text-muted">
                        {k.messageCount} {k.messageCount === 1 ? "message" : "messages"}
                        {" · "}
                        {new Date(k.startedAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </RandomConnect>
    </AppShell>
  );
}
