import { Suspense } from "react";
import { LoginForm } from "./form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex flex-col justify-between p-12 w-1/2 border-r border-hairline grain">
        <Link href="/" className="serif italic text-xl">— dating</Link>
        <div>
          <h1 className="display text-6xl">
            Soft launch,<br/>
            <span className="italic">hard truths.</span>
          </h1>
          <p className="mt-6 text-muted max-w-sm">A quieter way to meet people.</p>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()}</p>
      </aside>

      <main className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Sign in</p>
          <h2 className="display text-4xl mt-3">Welcome back.</h2>
          <p className="mt-3 text-muted text-sm">We'll send a link to your email.</p>

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
