import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./form";
import { LoginGallery } from "@/components/login-gallery";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // If a session cookie is already present, send the user straight to the
  // app. Without this, hitting browser-back from /discover lands on /login
  // and looks like a sign-out even though the cookie is still valid.
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/discover");
  } catch {
    // If Supabase env isn't set up, fall through to the form.
  }

  return (
    <div className="min-h-screen flex bg-white">
      <aside className="hidden md:block relative w-1/2 overflow-hidden bg-white border-r border-hairline">
        <LoginGallery />
        <div className="absolute top-6 left-6 z-10">
          <Link href="/" className="font-extrabold text-xl tracking-[-0.04em]">
            Hooked.
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Sign in</p>
          <h2 className="display text-4xl mt-3">Welcome back.</h2>
          <p className="mt-3 text-muted text-sm">Continue with your Google account.</p>

          <Suspense fallback={<div className="mt-10 text-sm text-muted">Loading…</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-12 text-xs text-muted">
            By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
