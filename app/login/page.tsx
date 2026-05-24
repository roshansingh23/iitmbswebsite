import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./form";
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-screen hero image */}
      <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover" />

      {/* Dark gradient so white text + the button stay legible */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.72) 100%)" }}
      />

      {/* Content — centered horizontally, pushed toward the bottom */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-end text-center px-8 pb-20">
        <div className="w-full max-w-sm">
          <h1 className="font-extrabold text-5xl tracking-[-0.05em] text-white">Mismatched.</h1>
          <p className="mt-4 text-white/85 text-[0.95rem] leading-relaxed">
            Where prompts beat poses and conversations turn into real dates.
            Say something that matters — and meet someone worth putting your
            phone down for.
          </p>

          <Suspense fallback={<div className="mt-8 text-sm text-white/70">Loading…</div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-xs text-white/60">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
