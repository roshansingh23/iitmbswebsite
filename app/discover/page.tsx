import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { gendersIWant } from "@/lib/matching";
import { AppShell } from "@/components/app-shell";
import { PromptBlock } from "@/components/prompt-block";
import { PhotoCard } from "@/components/photo-card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.gender || !me.orientation || me.showMe.length === 0) redirect("/onboarding");

  const wantGenders = gendersIWant(me.orientation as any, me.gender as any, me.showMe as any);

  let candidates: any[] = [];
  let dbError = false;
  const admin = supabaseAdmin();

  if (!admin) {
    dbError = true;
  } else {
    try {
      // Blocks both directions
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

      // Candidates with at least one photo + one prompt are filtered client-side
      // since PostgREST's nested relation filtering is limited.
      let q = admin
        .from("User")
        .select("id,name,age,gender,verified,foundingMember,lastSeenAt,createdAt,paused,showMe, photos:Photo(id,url,position), userPrompts:UserPrompt(id,answer,position,prompt:Prompt(text))")
        .neq("id", me.id)
        .eq("paused", false)
        .in("gender", wantGenders as any)
        .contains("showMe", [me.gender]);

      if (blockIds.size > 0) {
        q = q.not("id", "in", `(${Array.from(blockIds).join(",")})`);
      }

      const { data, error } = await q.limit(40);
      if (error) throw error;

      candidates = (data ?? [])
        .filter((u: any) => (u.photos ?? []).length > 0 && (u.userPrompts ?? []).length > 0)
        .sort((a: any, b: any) => {
          if (a.foundingMember !== b.foundingMember) return a.foundingMember ? -1 : 1;
          const at = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
          const bt = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
          return bt - at;
        })
        .slice(0, 24)
        .map((u: any) => ({
          ...u,
          photos: [...(u.photos ?? [])].sort((x, y) => x.position - y.position),
          userPrompts: [...(u.userPrompts ?? [])].sort((x, y) => x.position - y.position)
        }));
    } catch (e) {
      console.error("discover query failed:", e);
      dbError = true;
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-10 pb-24">
        <p className="eyebrow">People you vibe with</p>
        <h1 className="display text-5xl mt-3">For you, this week.</h1>

        {dbError ? (
          <div className="mt-14 card-line p-10">
            <p className="display text-2xl">Couldn't load profiles.</p>
            <p className="mt-3 text-muted text-sm">Refresh in a moment.</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-14 card-line p-10">
            <p className="display text-2xl">No fresh faces today.</p>
            <p className="mt-3 text-muted text-sm">Come back tomorrow — we shuffle the deck daily.</p>
          </div>
        ) : (
          <ul className="mt-12 space-y-12">
            {candidates.map((c) => {
              const photo = c.photos[0];
              const up = c.userPrompts[0];
              return (
                <li key={c.id} className="space-y-5">
                  <header className="flex items-baseline justify-between gap-4">
                    <Link href={`/profile/${c.id}`}>
                      <h2 className="display text-3xl">{c.name ?? "—"}</h2>
                    </Link>
                    <div className="flex items-center gap-2">
                      {c.verified && <Badge>Verified</Badge>}
                      {c.foundingMember && <Badge>Founding</Badge>}
                      {c.age && <span className="text-sm text-muted">{c.age}</span>}
                    </div>
                  </header>
                  {photo && <PhotoCard url={photo.url} alt={c.name ?? ""} />}
                  {up && <PromptBlock question={up.prompt.text} answer={up.answer} />}
                  <div className="pt-3">
                    <Link href={`/profile/${c.id}`} className="btn-line">Open profile</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
