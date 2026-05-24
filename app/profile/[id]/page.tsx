import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { ProfileViewClient, type DetailCandidate } from "@/components/profile-view-client";

export const dynamic = "force-dynamic";

export default async function ProfileDetailPage({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  if (params.id === me.id) {
    redirect("/me");
  }

  const admin = supabaseAdmin();
  if (!admin) notFound();

  const { data: u } = await admin
    .from("User")
    .select(
      "id,name,age,gender,orientation,bio,height,location,intentions," +
      "\"relationshipType\",verified,foundingMember,paused," +
      "photos:Photo(id,url,position)," +
      "userPrompts:UserPrompt(id,answer,position,prompt:Prompt(id,text))"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!u || (u as any).paused) notFound();

  const raw = u as any;
  const candidate: DetailCandidate = {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    gender: raw.gender,
    orientation: raw.orientation,
    bio: raw.bio,
    height: raw.height,
    location: raw.location,
    intentions: raw.intentions,
    relationshipType: raw.relationshipType,
    verified: !!raw.verified,
    foundingMember: !!raw.foundingMember,
    photos: [...(raw.photos ?? [])].sort((a: any, b: any) => a.position - b.position),
    userPrompts: [...(raw.userPrompts ?? [])].sort((a: any, b: any) => a.position - b.position)
  };

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-12">
        <ProfileViewClient candidate={candidate} />
      </div>
    </AppShell>
  );
}
