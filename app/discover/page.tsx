import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { poolDomainIds } from "@/lib/domain-resolve";
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

      // Same rule as random pairing: never show someone outside your pool.
      const scopeDomainIds = await poolDomainIds(me.poolId);

      const IMPRESSION_WINDOW_MS = 24 * 60 * 60 * 1000;
      const recentImpressionCutoff = new Date(Date.now() - IMPRESSION_WINDOW_MS).toISOString();

      const [
        { data: blocks },
        { data: myHooks },
        { data: myPasses },
        { data: myImpressions }
      ] = await Promise.all([
        admin.from("Block").select("fromUserId,toUserId")
          .or(`fromUserId.eq.${me.id},toUserId.eq.${me.id}`),
        admin.from("Hook").select("toUserId").eq("fromUserId", me.id),
        admin.from("Pass").select("toUserId,createdAt").eq("fromUserId", me.id),
        admin.from("Impression")
          .select("candidateId")
          .eq("viewerId", me.id)
          .gte("lastShownAt", recentImpressionCutoff)
      ]);

      const db = admin;

      // Hard excludes — never resurface: blocks, my hooks, recent passes.
      const hardExclude = new Set<string>();
      (blocks ?? []).forEach((b: any) => { hardExclude.add(b.fromUserId); hardExclude.add(b.toUserId); });
      (myHooks ?? []).forEach((h: any) => hardExclude.add(h.toUserId));

      const PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
      const passedAt = new Map<string, string>();
      (myPasses ?? []).forEach((p: any) => {
        passedAt.set(p.toUserId, p.createdAt);
        if (Date.now() - new Date(p.createdAt).getTime() < PASS_WINDOW_MS) {
          hardExclude.add(p.toUserId);
        }
      });
      hardExclude.delete(me.id);

      // Soft exclude — profiles seen in the last 24h. Keeps the deck fresh
      // when the pool is healthy, but is DROPPED when that would leave the
      // deck empty (small pool / heavy swiper) so we never dead-end.
      const impressionIds = new Set<string>();
      (myImpressions ?? []).forEach((i: any) => { if (i.candidateId !== me.id) impressionIds.add(i.candidateId); });

      // Snapshot fields — `me` re-widens to nullable inside the closure.
      const meId = me.id;
      const meGender = me.gender;
      const fAgeMin = me.filterAgeMin ?? 18;
      const fAgeMax = me.filterAgeMax ?? 99;
      const fIntentions = me.filterIntentions;
      const fActiveToday = me.filterActiveToday;
      const fNewHere = me.filterNewHere;

      async function fetchPool(exclude: Set<string>): Promise<Candidate[]> {
        // Mutual visibility: candidate.gender ∈ my showMe AND my gender ∈
        // candidate.showMe. Empty-showMe rows filtered by the not-null check.
        let q = db
          .from("User")
          .select(
            "id,name,age,gender,orientation,bio,height,location,intentions," +
            "\"relationshipType\",verified,foundingMember,paused,showMe,lastSeenAt,createdAt," +
            "photos:Photo(id,url,position)," +
            "userPrompts:UserPrompt(id,answer,position,prompt:Prompt(id,text))"
          )
          .neq("id", meId)
          .eq("paused", false)
          .not("showMe", "is", null)
          .in("gender", wantGenders as any)
          .contains("showMe", [meGender])
          .gte("age", fAgeMin)
          .lte("age", fAgeMax);

        if (scopeDomainIds) q = q.in("domainId", scopeDomainIds);
        if (fIntentions) q = q.eq("intentions", fIntentions);
        if (fActiveToday) {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          q = q.gte("lastSeenAt", dayAgo);
        }
        if (fNewHere) {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          q = q.gte("createdAt", weekAgo);
        }
        if (exclude.size > 0) {
          q = q.not("id", "in", `(${Array.from(exclude).join(",")})`);
        }

        const { data, error } = await q.limit(80);
        if (error) throw error;

        return ((data ?? []) as any[])
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
      }

      // First pass: hide everything seen in the last 24h. If that empties
      // the deck, retry showing previously-seen (but never passed/hooked/
      // blocked) profiles so heavy swipers on a small pool aren't stranded.
      const fullExclude = new Set<string>([...hardExclude, ...impressionIds]);
      let pool = await fetchPool(fullExclude);
      if (pool.length === 0 && impressionIds.size > 0) {
        pool = await fetchPool(hardExclude);
      }

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
