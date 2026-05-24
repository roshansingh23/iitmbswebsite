import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gendersIWant } from "@/lib/matching";
import { AppShell } from "@/components/app-shell";
import { ProfileCard } from "@/components/profile-card";
import { FilterBar } from "@/components/filter-bar";
import { CompletionBanner } from "@/components/completion-banner";

export const dynamic = "force-dynamic";

type Candidate = {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
  verified: boolean;
  foundingMember: boolean;
  paused: boolean;
  showMe: string[];
  lastSeenAt: string | null;
  createdAt: string | null;
  photos: { id: string; url: string; position: number }[];
  userPrompts: { id: string; answer: string; position: number; prompt: { id: string; text: string } }[];
};

export default async function DiscoverPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.gender || !me.orientation || me.showMe.length === 0) redirect("/onboarding");

  const wantGenders = gendersIWant(me.orientation as any, me.gender as any, me.showMe as any);

  let candidates: Candidate[] = [];
  let dbError = false;
  let needsCompletion = false;
  const admin = supabaseAdmin();

  if (!admin) {
    dbError = true;
  } else {
    try {
      // Profile-completion check — show the pink nudge if photos < 2 or
      // prompts < 3.
      const [{ count: photoCount }, { count: promptCount }] = await Promise.all([
        admin.from("Photo").select("id", { count: "exact", head: true }).eq("userId", me.id),
        admin.from("UserPrompt").select("id", { count: "exact", head: true }).eq("userId", me.id)
      ]);
      needsCompletion = (photoCount ?? 0) < 2 || (promptCount ?? 0) < 3;

      // Blocks (both directions)
      const { data: blocks } = await admin
        .from("Block")
        .select("fromUserId,toUserId")
        .or(`fromUserId.eq.${me.id},toUserId.eq.${me.id}`);
      const blockIds = new Set<string>();
      (blocks ?? []).forEach((b: any) => {
        blockIds.add(b.fromUserId);
        blockIds.add(b.toUserId);
      });
      blockIds.delete(me.id);

      let q = admin
        .from("User")
        .select(
          "id,name,age,gender,orientation,bio,verified,foundingMember,paused,showMe,lastSeenAt,createdAt," +
          "photos:Photo(id,url,position)," +
          "userPrompts:UserPrompt(id,answer,position,prompt:Prompt(id,text))"
        )
        .neq("id", me.id)
        .eq("paused", false)
        .in("gender", wantGenders as any)
        .contains("showMe", [me.gender]);
      if (blockIds.size > 0) {
        q = q.not("id", "in", `(${Array.from(blockIds).join(",")})`);
      }

      const { data, error } = await q.limit(40);
      if (error) throw error;

      candidates = ((data ?? []) as any[])
        .filter((u) => (u.photos ?? []).length > 0 && (u.userPrompts ?? []).length > 0)
        .map((u) => ({
          ...u,
          photos: [...(u.photos ?? [])].sort((a: any, b: any) => a.position - b.position),
          userPrompts: [...(u.userPrompts ?? [])].sort((a: any, b: any) => a.position - b.position)
        }))
        .sort((a, b) => {
          if (a.foundingMember !== b.foundingMember) return a.foundingMember ? -1 : 1;
          const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
          const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
          return bt - at;
        })
        .slice(0, 12);
    } catch (e) {
      console.error("discover query failed:", e);
      dbError = true;
    }
  }

  return (
    <AppShell>
      <div className="pt-2 pb-12">
        <FilterBar />
        {needsCompletion && <CompletionBanner />}

        <div className="px-4">
          {dbError ? (
            <div className="card-line p-6">
              <p className="font-semibold text-lg">Couldn't load profiles.</p>
              <p className="mt-2 text-muted text-sm">Try refreshing in a moment.</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="card-line p-6">
              <p className="font-semibold text-lg">No fresh faces today.</p>
              <p className="mt-2 text-muted text-sm">Come back tomorrow — we shuffle the deck daily.</p>
            </div>
          ) : (
            <ul className="space-y-12">
              {candidates.map((c) => (
                <li key={c.id}>
                  <ProfileCard candidate={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
