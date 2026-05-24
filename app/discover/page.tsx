import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gendersIWant } from "@/lib/matching";
import { rankCandidates, type Me, type CandidateInput } from "@/lib/recommender";
import { AppShell } from "@/components/app-shell";
import { DiscoverDeck } from "@/components/discover-deck";
import { FilterBar } from "@/components/filter-bar";
import { CompletionBanner } from "@/components/completion-banner";

export const dynamic = "force-dynamic";

type Candidate = CandidateInput & {
  name: string | null;
  gender: string | null;
  orientation: string | null;
  bio: string | null;
  height: string | null;
  paused: boolean;
  showMe: string[];
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
      const [{ count: photoCount }, { count: promptCount }] = await Promise.all([
        admin.from("Photo").select("id", { count: "exact", head: true }).eq("userId", me.id),
        admin.from("UserPrompt").select("id", { count: "exact", head: true }).eq("userId", me.id)
      ]);
      needsCompletion = (photoCount ?? 0) < 2 || (promptCount ?? 0) < 3;

      const [{ data: blocks }, { data: myHooks }, { data: myPasses }] = await Promise.all([
        admin.from("Block").select("fromUserId,toUserId")
          .or(`fromUserId.eq.${me.id},toUserId.eq.${me.id}`),
        admin.from("Hook").select("toUserId").eq("fromUserId", me.id),
        admin.from("Pass").select("toUserId,createdAt").eq("fromUserId", me.id)
      ]);

      const excludeIds = new Set<string>();
      (blocks ?? []).forEach((b: any) => { excludeIds.add(b.fromUserId); excludeIds.add(b.toUserId); });
      (myHooks ?? []).forEach((h: any) => excludeIds.add(h.toUserId));
      excludeIds.delete(me.id);

      // Recent passes (last 7d) are also excluded from the SQL pool. Older
      // passes can re-enter but get a soft decay penalty from the
      // recommender.
      const PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
      const passedAt = new Map<string, string>();
      const recentPasses = new Set<string>();
      (myPasses ?? []).forEach((p: any) => {
        passedAt.set(p.toUserId, p.createdAt);
        if (Date.now() - new Date(p.createdAt).getTime() < PASS_WINDOW_MS) {
          recentPasses.add(p.toUserId);
        }
      });
      recentPasses.forEach((id) => excludeIds.add(id));

      // Mutual visibility: candidate.gender ∈ my showMe AND my gender ∈
      // candidate.showMe. Empty-showMe rows filtered out by the not-null
      // check.
      let q = admin
        .from("User")
        .select(
          "id,name,age,gender,orientation,bio,height,location,intentions," +
          "\"relationshipType\",verified,foundingMember,paused,showMe,lastSeenAt,createdAt," +
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

      const { data, error } = await q.limit(80);
      if (error) throw error;

      // Cap each profile to 5 photos rendered.
      const pool = ((data ?? []) as any[])
        .filter((u) => (u.photos ?? []).length > 0 && (u.userPrompts ?? []).length > 0)
        .map((u): Candidate => {
          const photos = [...(u.photos ?? [])].sort((a: any, b: any) => a.position - b.position).slice(0, 5);
          const userPrompts = [...(u.userPrompts ?? [])].sort((a: any, b: any) => a.position - b.position);
          return {
            ...u,
            photos,
            userPrompts,
            photoCount: photos.length,
            promptCount: userPrompts.length
          };
        });

      const meInput: Me = {
        id: me.id,
        age: me.age,
        location: me.location,
        intentions: me.intentions,
        relationshipType: me.relationshipType,
        foundingMember: me.foundingMember
      };

      candidates = rankCandidates(meInput, pool, passedAt, 30) as Candidate[];
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
            <p className="font-semibold text-lg">We're slammed. Try again in a minute.</p>
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
