import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { OnboardingFlow } from "./flow";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const prompts = await db.prompt.findMany({
    where: { active: true },
    orderBy: { text: "asc" }
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="eyebrow">Find your vibe</p>
      <h1 className="display text-5xl mt-3">Set up your profile.</h1>
      <p className="mt-4 text-muted text-sm max-w-md">
        Three answers, a few photos, and how you want to be seen. Takes about five minutes.
      </p>
      <div className="mt-10">
        <OnboardingFlow
          initial={{
            name: user.name ?? "",
            age: user.age ?? null,
            bio: user.bio ?? "",
            gender: user.gender,
            orientation: user.orientation,
            showMe: user.showMe
          }}
          promptBank={prompts.map((p) => ({ id: p.id, text: p.text }))}
        />
      </div>
    </div>
  );
}
