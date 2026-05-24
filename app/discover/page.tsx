import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gendersIWant } from "@/lib/matching";
import { AppShell } from "@/components/app-shell";
import { DiscoverDeck } from "@/components/discover-deck";
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
  height: string | null;
  location: string | null;
  intentions: string | null;
  relationshipType: string | null;
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

      // Blocks (both directions) and anyone I've already hooked/matched.
      // The user explicitly doesn't want already-hooked profiles to keep
      // resurfacing in Discover.
      const [{ data: blocks }, { data: myHooks }] = await Promise.all([
        admin
          .from("Block")
          .select("fromUserId,toUserId")
          .or(`fromUserId.eq.${me.id},toUserId.eq.${me.id}`),
        admin
          .from("Hook")
          .select("toUserId")
          .eq("fromUserId", me.id)
      ]);
      const excludeIds = new Set<string>();
      (blocks ?? []).forEach((b: any) => {
        excludeIds.add(b.fromUserId);
        excludeIds.add(b.toUserId);
      });
      (myHooks ?? []).forEach((h: any) => excludeIds.add(h.toUserId));
      excludeIds.delete(me.id);

      // Mutual visibility rule — a candidate is ONLY shown when:
      //   1. their gender is in my showMe  (.in on gender)
      //   2. my gender is in their showMe  (.contains on showMe)
      // The second clause is what guarantees that, e.g., a gay man
      // (showMe = ["man"]) NEVER appears to a woman (her gender "woman"
      // isn't in his ["man"]), and a straight woman (showMe = ["man"])
      // never appears to another woman either. Empty-showMe rows can't
      // satisfy the contains check, so unfinished onboarding profiles
      // are filtered out automatically.
      let q = admin
        .from("User")
        .select(
          "id,name,age,gender,orientation,bio,height,location,intentions,\"relationshipType\",verified,foundingMember,paused,showMe,lastSeenAt,createdAt," +
          "photos:Photo(id,url,position)," +
          "userPrompts:UserPrompt(id,answer,position,prompt:Prompt(id,text))"
        )
        .neq("id", me.id)
        .eq("paused", false)
        .not("showMe", "is", null)
        .in("gender", wantGenders as any)
        .contains("showMe", [me.gender])
        .gte("age", me.filterAgeMin ?? 18)
        .lte("age", me.filterAgeMax ?? 99);

      if (me.filterIntentions) q = q.eq("intentions", me.filterIntentions);
      if (me.filterActiveToday) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("lastSeenAt", dayAgo);
      }
      if (me.filterNewHere) {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("createdAt", weekAgo);
      }
      if (excludeIds.size > 0) {
        q = q.not("id", "in", `(${Array.from(excludeIds).join(",")})`);
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
        <FilterBar initial={{
          filterAgeMin: me.filterAgeMin,
          filterAgeMax: me.filterAgeMax,
          filterIntentions: me.filterIntentions,
          filterActiveToday: me.filterActiveToday,
          filterNewHere: me.filterNewHere
        }} />
        {needsCompletion && <CompletionBanner />}

        {dbError ? (
          <div className="card-line p-6 mx-4">
            <p className="font-semibold text-lg">Couldn't load profiles.</p>
            <p className="mt-2 text-muted text-sm">Try refreshing in a moment.</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="card-line p-6 mx-4">
            <p className="font-semibold text-lg">No fresh faces today.</p>
            <p className="mt-2 text-muted text-sm">Come back tomorrow — we shuffle the deck daily.</p>
          </div>
        ) : (
          <DiscoverDeck candidates={candidates as any} />
        )}
      </div>
    </AppShell>
  );
}
