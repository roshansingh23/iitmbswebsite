import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { OnboardingFlow } from "./flow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let prompts: { id: string; text: string }[] = [];
  const admin = supabaseAdmin();
  if (admin) {
    const { data } = await admin
      .from("Prompt")
      .select("id, text")
      .eq("active", true)
      .order("text", { ascending: true });
    prompts = (data ?? []) as { id: string; text: string }[];
  }

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
            gender: user.gender as any,
            orientation: user.orientation as any,
            showMe: user.showMe as any
          }}
          promptBank={prompts}
        />
      </div>
    </div>
  );
}
