import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { PhotoCard } from "@/components/photo-card";
import { PromptBlock } from "@/components/prompt-block";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "./signout";
import { PauseToggle } from "./pause";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  let photos: { id: string; url: string }[] = [];
  let userPrompts: { id: string; answer: string; prompt: { text: string } }[] = [];
  const admin = supabaseAdmin();
  if (admin) {
    const { data: ph } = await admin
      .from("Photo")
      .select("id,url,position")
      .eq("userId", me.id)
      .order("position", { ascending: true });
    photos = (ph ?? []) as any;

    const { data: up } = await admin
      .from("UserPrompt")
      .select("id,answer,position,prompt:Prompt(text)")
      .eq("userId", me.id)
      .order("position", { ascending: true });
    userPrompts = (up ?? []) as any;
  }

  const needsOnboarding =
    !me.gender || !me.orientation || me.showMe.length === 0 || photos.length === 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 lg:px-10 py-12">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Your profile</p>
            <h1 className="display text-5xl mt-3">{me.name ?? "—"}</h1>
            <p className="mt-2 text-muted text-sm">{me.age ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {me.verified && <Badge>Verified</Badge>}
            {me.foundingMember && <Badge>Founding</Badge>}
            <Badge>{me.accessTier}</Badge>
          </div>
        </header>

        {needsOnboarding && (
          <div className="mt-8 card-line p-6">
            <p className="serif italic text-xl">Finish setting up to start matching.</p>
            <Link href="/onboarding" className="btn-ink mt-5 inline-flex">Continue setup</Link>
          </div>
        )}

        <section className="mt-12 card-line p-7">
          <p className="eyebrow">Your QR</p>
          <p className="mt-3 text-sm text-muted">
            Show this to someone IRL — scanning opens your profile and lets them
            connect instantly.
          </p>
          {me.qrCode ? (
            <div className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${me.qrCode}`}
                alt="Your QR"
                width={200}
                height={200}
                className="rounded-[2px] border border-hairline"
              />
              <p className="mt-3 text-xs text-muted font-mono">{me.qrCode}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm">Your QR is being generated.</p>
          )}
        </section>

        {photos.length > 0 && (
          <section className="mt-12 grid grid-cols-2 gap-4">
            {photos.map((p) => (
              <PhotoCard key={p.id} url={p.url} alt="" />
            ))}
          </section>
        )}

        {userPrompts.length > 0 && (
          <section className="mt-10 space-y-4">
            {userPrompts.map((up: any) => (
              <PromptBlock key={up.id} question={up.prompt.text} answer={up.answer} />
            ))}
          </section>
        )}

        <section className="mt-14 border-t border-hairline pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="serif italic text-xl">Pause mode</p>
              <p className="text-sm text-muted">Hide your profile from discovery.</p>
            </div>
            <PauseToggle initial={me.paused} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-hairline">
            <Link href="/onboarding" className="btn-quiet">Edit profile</Link>
            <SignOutButton />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
