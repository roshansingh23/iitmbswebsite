import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
import { PhotoManager, type Photo } from "@/components/photo-manager";
import { PromptBlock } from "@/components/prompt-block";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "./signout";
import { PauseToggle } from "./pause";
import { AddPromptButton } from "@/components/add-prompt-button";
import { ScanQrButton } from "@/components/scan-qr-button";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  let photos: Photo[] = [];
  let userPrompts: { id: string; answer: string; promptId: string; prompt: { text: string } }[] = [];
  let promptBank: { id: string; text: string }[] = [];
  const admin = supabaseAdmin();
  if (admin) {
    const [phResp, upResp, bankResp] = await Promise.all([
      admin.from("Photo").select("id,url,publicId,position").eq("userId", me.id).order("position", { ascending: true }),
      admin.from("UserPrompt").select("id,answer,position,promptId,prompt:Prompt(text)").eq("userId", me.id).order("position", { ascending: true }),
      admin.from("Prompt").select("id,text").eq("active", true).order("text", { ascending: true })
    ]);
    photos = (phResp.data ?? []) as any;
    userPrompts = (upResp.data ?? []) as any;
    promptBank = (bankResp.data ?? []) as any;
  }

  const usedPromptIds = userPrompts.map((u) => u.promptId);

  const needsOnboarding =
    !me.gender || !me.orientation || me.showMe.length === 0 || photos.length === 0;

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-12">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-3xl tracking-[-0.04em]">{me.name ?? "—"}</h1>
            <p className="mt-1 text-muted text-sm">{me.age ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {me.verified && <Badge>Verified</Badge>}
            {me.foundingMember && <Badge>Founding</Badge>}
            <Badge>{me.accessTier}</Badge>
          </div>
        </header>

        {needsOnboarding && (
          <div className="mt-6 card-line p-5">
            <p className="font-semibold">Finish setting up to start matching.</p>
            <Link href="/onboarding" className="btn-ink mt-4 inline-flex">Continue setup</Link>
          </div>
        )}

        <section className="mt-10">
          <header className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-lg">Photos</h2>
            <span className="text-xs text-muted">{photos.length} / 5</span>
          </header>
          <PhotoManager initialPhotos={photos} />
        </section>

        <section className="mt-10">
          <header className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-lg">Answers</h2>
            <AddPromptButton bank={promptBank} alreadyUsed={usedPromptIds} />
          </header>
          {userPrompts.length === 0 ? (
            <div className="card-line p-5">
              <p className="font-semibold">No answers yet.</p>
              <p className="mt-1 text-muted text-sm">Pick a prompt and write something.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {userPrompts.map((up: any) => (
                <li key={up.id}>
                  <PromptBlock question={up.prompt.text} answer={up.answer} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 card-line p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-lg">Your QR</h2>
            <ScanQrButton />
          </div>
          <p className="mt-2 text-sm text-muted">
            Show yours in person, or scan someone else's to open their profile.
          </p>
          {me.qrCode ? (
            <div className="mt-4 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${me.qrCode}`}
                alt="Your QR"
                width={140}
                height={140}
                className="rounded-[10px]"
              />
              <p className="text-xs text-muted font-mono break-all pt-1">{me.qrCode}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm">Your QR is being generated.</p>
          )}
        </section>

        <section className="mt-10 card-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Pause mode</p>
              <p className="text-sm text-muted mt-1">Hide your profile from discovery.</p>
            </div>
            <PauseToggle initial={me.paused} />
          </div>
        </section>

        <section className="mt-8 flex items-center justify-between">
          <Link href="/onboarding" className="text-sm underline">Edit answers</Link>
          <SignOutButton />
        </section>
      </div>
    </AppShell>
  );
}
