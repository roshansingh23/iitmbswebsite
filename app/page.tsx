import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Manifesto />
        <ThreeReasons />
        <PromptShowcase />
        <PullQuote />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Header
   ───────────────────────────────────────────────────────────────────────── */
function SiteHeader() {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="serif italic text-xl tracking-tight">— dating</Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#prompts" className="hover:text-ink">Prompts</Link>
          <Link href="/#manifesto" className="hover:text-ink">Manifesto</Link>
        </nav>
        <Link href="/login" className="btn-ink">Get the app</Link>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero — large serif headline + sample prompt card to its right
   ───────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative grain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 pb-24 md:pt-28 md:pb-32">
        <p className="eyebrow">A quieter dating app</p>

        <div className="mt-8 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <h1 className="display text-[3.5rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem]">
              Designed to<br/>
              be <span className="italic">read.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg text-ink leading-relaxed">
              We replaced the swipe stack with answered prompts. You meet someone
              the way you'd meet them on paper — by what they said, not by how
              they look in profile.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/login" className="btn-ink">Get started</Link>
              <Link href="#how" className="btn-line">How it works</Link>
            </div>

            <ul className="mt-14 grid grid-cols-3 max-w-md gap-6 border-t border-hairline pt-6">
              <li>
                <p className="display text-3xl">3+</p>
                <p className="mt-1 text-xs text-muted leading-snug">Prompts answered per profile</p>
              </li>
              <li>
                <p className="display text-3xl">0</p>
                <p className="mt-1 text-xs text-muted leading-snug">Drive-by swipes</p>
              </li>
              <li>
                <p className="display text-3xl">1</p>
                <p className="mt-1 text-xs text-muted leading-snug">Note per hook, optional</p>
              </li>
            </ul>
          </div>

          {/* Hero card stack — mimics what a profile actually looks like in the
              app. Two cards layered with a subtle offset. */}
          <div className="lg:col-span-5 relative">
            <div className="relative">
              <SamplePromptCard
                question="Soft launch or hard launch person?"
                answer="Soft launch. Then a blurry photo. Then nothing for a month. Then a wedding invite. That's the order."
                name="Aanya"
                age={26}
                className="relative z-10"
              />
              <SamplePromptCard
                question="My toxic trait is…"
                answer="Sending one-word replies and then writing three pages in my Notes app."
                name="Ishaan"
                age={28}
                className="absolute -bottom-12 -right-4 sm:-right-8 z-0 opacity-90 hidden md:block"
                small
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex items-center justify-between text-xs text-muted">
          <span className="eyebrow">No swipes</span>
          <span className="eyebrow hidden sm:inline">No gradients</span>
          <span className="eyebrow">No red hearts</span>
          <span className="eyebrow hidden sm:inline">No vanishing matches</span>
        </div>
      </div>
    </section>
  );
}

/* A self-contained replica of the in-app prompt block, dressed for marketing. */
function SamplePromptCard({
  question,
  answer,
  name,
  age,
  className = "",
  small = false
}: {
  question: string;
  answer: string;
  name: string;
  age: number;
  className?: string;
  small?: boolean;
}) {
  return (
    <article className={"card-line " + className}>
      <div className={small ? "p-6" : "p-7 md:p-9"}>
        <header className="flex items-baseline justify-between border-b border-hairline pb-4">
          <p className="display text-2xl tracking-tightish">{name}</p>
          <p className="text-xs text-muted">{age}</p>
        </header>
        <p className={"mt-6 " + (small ? "text-lg" : "text-2xl") + " serif italic leading-snug text-ink"}>
          {question}
        </p>
        <p className={"mt-5 " + (small ? "text-sm" : "text-base") + " leading-relaxed text-ink"}>
          {answer}
        </p>
        <div className="mt-7 pt-5 border-t border-hairline flex items-center justify-between">
          <span className="text-xs text-muted">Hook this prompt</span>
          <span className="btn-ink text-[0.7rem] py-2 px-4">Hook</span>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Manifesto — one big sentence carrying the brand voice
   ───────────────────────────────────────────────────────────────────────── */
function Manifesto() {
  return (
    <section id="manifesto" className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <p className="eyebrow">Manifesto</p>
        <h2 className="display mt-6 text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] max-w-5xl leading-[1.02]">
          We don't think the right person is two thumbs away. We think they
          wrote <span className="italic">something honest</span> last week,
          and you'd recognise the voice if you read it.
        </h2>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Three reasons — numbered editorial blocks
   ───────────────────────────────────────────────────────────────────────── */
function ThreeReasons() {
  const rows = [
    {
      n: "01",
      title: "Prompts, not poses.",
      body:
        "Every profile is built around three answered questions. Pictures are there, but the front door is what they said. People who can write a sentence about themselves are people worth meeting."
    },
    {
      n: "02",
      title: "Hook with intent.",
      body:
        "There is no like button. You hook a specific photo or a specific answer — and you can attach a note. Drive-by interest doesn't survive a UI that asks you to be specific."
    },
    {
      n: "03",
      title: "Chat that respects time.",
      body:
        "Conversations don't expire arbitrarily. They live as long as two people keep coming back. If she hasn't replied in an hour, nothing on your side burns down."
    }
  ];
  return (
    <section id="how" className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">How it works</p>
            <h2 className="display text-4xl md:text-5xl mt-5">
              Three small<br/>
              <span className="italic">design choices.</span>
            </h2>
          </div>
          <ol className="lg:col-span-8 space-y-12">
            {rows.map((r) => (
              <li key={r.n} className="grid grid-cols-12 gap-6 border-b border-hairline pb-12 last:border-0 last:pb-0">
                <div className="col-span-2 md:col-span-1 text-muted font-mono text-sm pt-1">
                  {r.n}
                </div>
                <div className="col-span-10 md:col-span-11">
                  <h3 className="display text-3xl md:text-4xl">{r.title}</h3>
                  <p className="mt-4 text-ink max-w-prose2 leading-relaxed">{r.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Prompt showcase — a grid of sample prompts you can browse, like a gallery
   ───────────────────────────────────────────────────────────────────────── */
function PromptShowcase() {
  const samples = [
    { q: "We'll get along if…", a: "You have a strong opinion about chai and you're willing to defend it." },
    { q: "A green flag I look for…", a: "Texts back at a normal speed. No three-minute essays, no three-day silences." },
    { q: "I'm weirdly good at…", a: "Parallel parking on the first try. Auto rickshaw negotiations. Crying at songs in languages I don't speak." },
    { q: "I go quiet when…", a: "I'm reading something I love. Ask me what it is — I want to tell you." },
    { q: "An unpopular opinion I'll die on", a: "Bombay is just one really long beach with a city draped over it." },
    { q: "The way to my heart is…", a: "Show up with mangoes in May. Don't make a thing of it." }
  ];
  return (
    <section id="prompts" className="border-t border-hairline bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">From the prompt bank</p>
            <h2 className="display text-5xl md:text-6xl mt-4 max-w-xl">
              Real answers,<br/>
              <span className="italic">from real people.</span>
            </h2>
          </div>
          <p className="text-sm text-muted max-w-sm">
            Every profile picks three. The questions don't change — the answers
            do all the work.
          </p>
        </div>

        <ul className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {samples.map((s, i) => (
            <li key={i} className="card-line p-6 md:p-7">
              <p className="prompt-q">{s.q}</p>
              <p className="prompt-a mt-5">{s.a}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Pull quote — single voice, large italic serif
   ───────────────────────────────────────────────────────────────────────── */
function PullQuote() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <figure className="max-w-4xl">
          <blockquote className="display text-3xl md:text-5xl leading-[1.05]">
            <span className="serif italic text-muted">"</span>
            I deleted four apps before I tried this one. The thing I didn't
            expect was that I read every profile before I hooked. That's
            <span className="italic"> never </span>
            happened to me on a dating app before.
            <span className="serif italic text-muted">"</span>
          </blockquote>
          <figcaption className="mt-10 text-sm text-muted">
            <span className="eyebrow">Early user · Bombay</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Closing CTA
   ───────────────────────────────────────────────────────────────────────── */
function ClosingCta() {
  return (
    <section className="border-t border-hairline bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <p className="eyebrow">Ready</p>
            <h2 className="display text-5xl md:text-7xl mt-4 max-w-3xl">
              Bring your voice.<br/>
              <span className="italic">We'll find your reader.</span>
            </h2>
          </div>
          <div className="md:col-span-4 md:text-right space-y-3">
            <Link href="/login" className="btn-ink">Get started</Link>
            <p className="text-xs text-muted">Email verification only. No app store yet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────────────────── */
function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="serif italic text-2xl">— dating</Link>
          <p className="mt-5 max-w-sm text-sm text-muted leading-relaxed">
            A quieter dating app. Prompts over poses, hooks over swipes, and
            conversations that don't time out on you.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-4">App</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/#how">How it works</Link></li>
            <li><Link href="/#prompts">Prompts</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-4">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#manifesto">Manifesto</Link></li>
            <li><Link href="/safety">Safety</Link></li>
            <li><Link href="/press">Press</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow mb-4">Legal</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/community">Community guidelines</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-14 flex items-center justify-between text-xs text-muted">
          <span>© {year} — dating</span>
          <span>Made with serifs.</span>
        </div>
      </div>
    </footer>
  );
}
