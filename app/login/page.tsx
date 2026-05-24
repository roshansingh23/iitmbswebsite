import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./form";
import { LoginGallery } from "@/components/login-gallery";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Same hero used on the marketing homepage.
const HERO_IMAGE = "https://ceranna.com/wp-content/uploads/2017/03/mg_7929.jpg";

export default async function LoginPage() {
  // Already signed in? Straight to the app.
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/discover");
  } catch {
    // Supabase env not set — fall through to the form.
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Image — homepage hero on mobile (top), animated gallery on desktop. */}
      <div className="relative h-[42vh] md:h-auto md:w-1/2 md:min-h-screen overflow-hidden border-b border-hairline md:border-b-0 md:border-r">
        <div className="md:hidden absolute inset-0">
          <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="hidden md:block absolute inset-0">
          <LoginGallery />
          <div className="absolute top-6 left-6 z-10">
            <Link href="/" className="font-extrabold text-xl tracking-[-0.04em]">Mismatched.</Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center px-8 py-10 md:p-12">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-extrabold text-4xl tracking-[-0.045em]">Mismatched.</h1>
          <p className="mt-3 text-muted text-sm leading-relaxed">
            Prompts over poses, real conversations. Continue with your account to start.
          </p>

          <Suspense fallback={<div className="mt-8 text-sm text-muted">Loading…</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-10 text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
