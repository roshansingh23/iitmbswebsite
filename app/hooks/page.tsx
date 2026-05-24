import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

type HookRow = {
  id: string;
  isHardHook: boolean;
  note: string | null;
  createdAt: string;
  fromUserId: string;
  toUserId: string;
  other: { id: string; name: string | null } | null;
};

export default async function HooksPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  let incoming: HookRow[] = [];
  let outgoing: HookRow[] = [];
  let dbError = false;

  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      const { data: inRows } = await admin
        .from("Hook")
        .select("id,isHardHook,note,createdAt,fromUserId,toUserId, fromUser:User!Hook_fromUserId_fkey(id,name)")
        .eq("toUserId", me.id)
        .order("isHardHook", { ascending: false })
        .order("createdAt", { ascending: false });
      incoming = ((inRows ?? []) as any[]).map((r) => ({ ...r, other: r.fromUser }));

      const { data: outRows } = await admin
        .from("Hook")
        .select("id,isHardHook,note,createdAt,fromUserId,toUserId, toUser:User!Hook_toUserId_fkey(id,name)")
        .eq("fromUserId", me.id)
        .order("createdAt", { ascending: false });
      outgoing = ((outRows ?? []) as any[]).map((r) => ({ ...r, other: r.toUser }));
    } catch (e) {
      console.error("hooks query failed:", e);
      dbError = true;
    }
  }

  const canSeeIncoming = me.accessTier === "insights" || me.accessTier === "plus";

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-12">
        <h1 className="font-extrabold text-2xl tracking-[-0.04em]">Hooks</h1>

        {dbError && (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load hooks.</p>
            <p className="text-muted text-sm mt-1">Try again in a moment.</p>
          </div>
        )}

        <section className="mt-8">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold text-lg">Hooked you</h2>
            <span className="text-xs text-muted">{incoming.length}</span>
          </header>

          {incoming.length === 0 ? (
            <p className="text-muted text-sm">No hooks yet — go shoot your shot.</p>
          ) : !canSeeIncoming ? (
            <div className="card-line p-5">
              <p className="font-semibold text-lg">
                {incoming.length} {incoming.length === 1 ? "person has" : "people have"} hooked you.
              </p>
              <p className="mt-2 text-muted text-sm">
                Upgrade to see who and prioritise your replies.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {incoming.map((h) => (
                <li key={h.id} className="card-line p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-lg">{h.other?.name ?? "—"}</p>
                    {h.isHardHook && (
                      <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-muted">
                        Hard hook
                      </span>
                    )}
                  </div>
                  {h.note && <p className="mt-2 text-sm text-ink/85">"{h.note}"</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold text-lg">Lines out</h2>
            <span className="text-xs text-muted">{outgoing.length}</span>
          </header>
          {outgoing.length === 0 ? (
            <p className="text-muted text-sm">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {outgoing.map((h) => (
                <li key={h.id} className="py-3 flex items-center justify-between">
                  <span>{h.other?.name ?? "—"}</span>
                  <span className="text-xs text-muted">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
