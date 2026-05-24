import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { AppShell } from "@/components/app-shell";
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
    <AppShell>
      <div className="px-5 pt-6 pb-12">
        <h1 className="font-extrabold text-3xl tracking-[-0.04em]">Set up your profile.</h1>
        <p className="mt-2 text-muted text-sm">Three answers, a few photos, and how you want to be seen.</p>
        <div className="mt-8">
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
    </AppShell>
  );
}
