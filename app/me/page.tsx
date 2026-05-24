import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BadgeCheck, Pencil, User as UserIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { thumb } from "@/lib/cloudinary-thumb";
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

  // Profile completion %: photos (40%) + prompts (40%) + the bio/location/
  // intentions/relationshipType/height key fields (20%).
  const filledFields = [me.bio, me.location, me.intentions, me.relationshipType, me.height]
    .filter(Boolean).length;
  const completionPct = Math.round(
    ((Math.min(photos.length, 5) / 5) * 0.4 +
     (Math.min(userPrompts.length, 3) / 3) * 0.4 +
     (filledFields / 5) * 0.2) * 100
  );
  const avatar = photos[0]?.url ?? null;

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-12">
        <section className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-tint border border-hairline relative">
              {avatar ? (
                <Image
                  src={thumb(avatar, 300)}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                  <UserIcon size={56} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <Link
              href="/onboarding"
              aria-label="Edit profile"
              className="absolute top-0 right-0 w-9 h-9 rounded-full bg-white border border-hairline flex items-center justify-center active:scale-95 transition-transform duration-100"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                touchAction: "manipulation"
              }}
            >
              <Pencil size={15} strokeWidth={2} className="text-ink" />
            </Link>

            {completionPct < 100 && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-ink text-white rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-tight"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
              >
                {completionPct}%
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-1.5">
            <h1 className="font-extrabold text-3xl tracking-[-0.03em]">{me.name ?? "—"}</h1>
            {me.verified && (
              <BadgeCheck
                size={22}
                strokeWidth={2}
                style={{ color: "#D43A2F", fill: "transparent" }}
                aria-label="Verified"
              />
            )}
          </div>

          <p className="mt-1 text-sm text-muted">
            {needsOnboarding ? "Incomplete profile" : "Profile complete"}
          </p>

          {needsOnboarding && (
            <Link href="/onboarding" className="btn-ink mt-5 inline-flex">
              Continue setup
            </Link>
          )}

          {(me.foundingMember || me.accessTier !== "free") && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {me.foundingMember && <Badge>Founding</Badge>}
              {me.accessTier !== "free" && <Badge>{me.accessTier}</Badge>}
            </div>
          )}
        </section>

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
