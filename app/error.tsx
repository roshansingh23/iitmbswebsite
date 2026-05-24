"use client";

import Link from "next/link";

export default function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-white px-6 py-24 flex items-start justify-center">
      <div className="max-w-md w-full">
        <p className="eyebrow">Something broke</p>
        <h1 className="display text-5xl mt-3">Try again.</h1>
        <p className="mt-5 text-muted leading-relaxed">
          We hit a snag rendering this page.
        </p>
        {error?.digest && (
          <p className="mt-4 font-mono text-xs text-muted">digest: {error.digest}</p>
        )}
        <div className="mt-8 flex gap-3">
          <button onClick={reset} className="btn-ink">Try again</button>
          <Link href="/" className="btn-line">Home</Link>
        </div>
      </div>
    </div>
  );
}
