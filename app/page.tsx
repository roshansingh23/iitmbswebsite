import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-14 flex items-center justify-between">
          <span className="serif italic text-xl">— dating</span>
          <Link href="/login" className="text-sm text-muted hover:text-ink">Sign in</Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative grain">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-24 pb-28 md:pt-36 md:pb-40">
            <p className="eyebrow">A quieter dating app</p>
            <h1 className="display mt-7 text-6xl md:text-8xl max-w-5xl">
              Built for the<br/>
              <span className="italic">soft launch.</span>
            </h1>
            <p className="mt-10 max-w-xl text-lg text-ink leading-relaxed">
              No swipe stack. No red hearts. Read the prompts, find your vibe,
              and shoot your shot when you mean it.
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link href="/login" className="btn-ink">Get started</Link>
              <Link href="#how" className="btn-line">How it works</Link>
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-hairline">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 md:py-32 grid md:grid-cols-3 gap-10">
            {[
              {
                h: "Prompts over photos",
                p: "Every profile is built around answers, not angles. The serif question is the front door."
              },
              {
                h: "Hook, don't swipe",
                p: "You hook a specific photo or a specific answer — with a note, if you want. No drive-by likes."
              },
              {
                h: "Chat by interaction",
                p: "Your conversation clock only ticks when you're both actually talking. If she hasn't replied in an hour, nothing burns."
              }
            ].map((b) => (
              <article key={b.h}>
                <h2 className="display text-3xl">{b.h}</h2>
                <p className="mt-4 text-muted">{b.p}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-hairline bg-card">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 md:py-32">
            <p className="eyebrow">The vibe</p>
            <h2 className="display text-5xl md:text-6xl mt-4 max-w-3xl">
              No glow. No gradients.<br/>
              <span className="italic">Just good typography</span> and people<br/>
              writing things they actually mean.
            </h2>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-20 grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-8">
              <h2 className="display text-4xl">Ready when you are.</h2>
              <p className="mt-3 text-muted max-w-md">Verify your email and you're in.</p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Link href="/login" className="btn-ink">Sign in</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 h-14 flex items-center justify-between text-xs text-muted">
          <span>© {new Date().getFullYear()} —</span>
          <div className="flex gap-5">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
