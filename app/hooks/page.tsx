import Link from "next/link";
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

export default async function HooksPage({ searchParams }: { searchParams: { tab?: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const tab = searchParams.tab === "matched" ? "matched" : "sent";

  let sent: HookRow[] = [];
  let matched: HookRow[] = [];
  let dbError = false;

  const admin = supabaseAdmin();
  if (!admin) {
    dbError = true;
  } else {
    try {
      // Everyone I've sent a hook to
      const { data: out } = await admin
        .from("Hook")
        .select("id,isHardHook,note,createdAt,fromUserId,toUserId, toUser:User!Hook_toUserId_fkey(id,name)")
        .eq("fromUserId", me.id)
        .order("createdAt", { ascending: false });
      const outgoing = ((out ?? []) as any[]).map((r) => ({ ...r, other: r.toUser }));

      // Everyone who has hooked me back (their fromUserId is in the
      // outgoing.toUserId list)
      const targetIds = outgoing.map((r) => r.toUserId);
      let reverseSet = new Set<string>();
      if (targetIds.length > 0) {
        const { data: rev } = await admin
          .from("Hook")
          .select("fromUserId")
          .eq("toUserId", me.id)
          .in("fromUserId", targetIds);
        reverseSet = new Set((rev ?? []).map((r: any) => r.fromUserId));
      }

      matched = outgoing.filter((r) => reverseSet.has(r.toUserId));
      sent = outgoing.filter((r) => !reverseSet.has(r.toUserId));
    } catch (e) {
      console.error("hooks query failed:", e);
      dbError = true;
    }
  }

  const list = tab === "matched" ? matched : sent;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        <div className="grid grid-cols-2 gap-3">
          <TabButton
            href="/hooks?tab=sent"
            label="Request sent"
            count={sent.length}
            active={tab === "sent"}
          />
          <TabButton
            href="/hooks?tab=matched"
            label="Matched"
            count={matched.length}
            active={tab === "matched"}
          />
        </div>

        {dbError ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">Couldn't load.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="card-line p-5 mt-6">
            <p className="font-semibold">
              {tab === "matched" ? "No matches yet." : "No requests sent yet."}
            </p>
            <p className="mt-1 text-muted text-sm">
              {tab === "matched"
                ? "When someone matches you back, they'll show up here."
                : "Send a match from Discover and it'll appear here."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {list.map((h) => (
              <li key={h.id} className="card-line p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-base">{h.other?.name ?? "—"}</p>
                  {h.isHardHook && (
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] font-semibold text-muted">
                      Priority
                    </span>
                  )}
                </div>
                {h.note && <p className="mt-2 text-sm text-ink/85">"{h.note}"</p>}
                <p className="mt-2 text-xs text-muted">
                  {new Date(h.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function TabButton({
  href, label, count, active
}: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        "rounded-2xl border p-4 transition active:scale-[0.98] " +
        (active
          ? "border-ink bg-ink text-white"
          : "border-hairline bg-white text-ink")
      }
    >
      <p className="text-sm font-semibold leading-tight">{label}</p>
      <p
        className={
          "mt-1 text-2xl font-extrabold tracking-[-0.03em] " +
          (active ? "text-white" : "text-ink")
        }
      >
        {count}
      </p>
    </Link>
  );
}
