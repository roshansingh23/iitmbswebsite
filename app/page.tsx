import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-bone">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <PhotoCarousel />
        <FunkyStatement />
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
   Empty image frame — hairline border + tint surface + soft shadow + tiny
   corner label so each blank reads as deliberate placeholder.
   ───────────────────────────────────────────────────────────────────────── */
function Frame({
  aspect = "4/5",
  label = "Photo",
  className = ""
}: {
  aspect?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={"card-line bg-tint relative overflow-hidden " + className}
      style={{ aspectRatio: aspect }}
    >
      <span
        className="absolute top-3 left-3"
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--muted)",
          fontWeight: 600
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Header — brand left, links center, CTA right.
   ───────────────────────────────────────────────────────────────────────── */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-bone/85 backdrop-blur border-b border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 grid grid-cols-3 items-center">
        <div className="flex items-center">
          <Link
            href="/"
            className="font-extrabold tracking-[-0.04em] text-xl"
          >
            Hooked.
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-10 text-[0.82rem] font-medium">
          <NavLink href="#how">How it works</NavLink>
          <NavLink href="#prompts">Prompts</NavLink>
          <NavLink href="#voices">Voices</NavLink>
          <NavLink href="#safety">Safety</NavLink>
        </nav>

        <div className="flex items-center justify-end gap-4">
          <Link href="/login" className="hidden sm:inline text-sm font-medium hover:text-muted transition">
            Sign in
          </Link>
          <Link href="/login" className="btn-ink">Get the app</Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-ink hover:text-muted transition-colors"
    >
      {children}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero — Inter doing the headline work via heavy weight + tight tracking
   ───────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative grain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-20 md:pt-24 md:pb-28">
        <p className="eyebrow">A quieter dating app</p>

        <div className="mt-8 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <h1 className="display text-[3.25rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[6.75rem]">
              Designed to be{" "}
              <span className="display-italic font-medium">read.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-ink/85">
              We replaced the swipe stack with answered prompts. You meet
              someone the way you would on paper — by what they said, not by
              how they look in profile.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/login" className="btn-ink">Get started</Link>
              <Link href="#how" className="btn-line">How it works</Link>
            </div>

            <ul className="mt-14 grid grid-cols-3 max-w-md gap-6 border-t border-hairline pt-6">
              <li>
                <p className="display text-3xl">3+</p>
                <p className="mt-1 text-xs text-muted leading-snug">Prompts per profile</p>
              </li>
              <li>
                <p className="display text-3xl">0</p>
                <p className="mt-1 text-xs text-muted leading-snug">Drive-by swipes</p>
              </li>
              <li>
                <p className="display text-3xl">1</p>
                <p className="mt-1 text-xs text-muted leading-snug">Note per hook</p>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5 relative">
            <Frame aspect="4/5" label="Portrait" />
            <article className="card-line absolute -bottom-8 -left-4 sm:-left-10 w-[80%] max-w-[360px] hidden md:block">
              <div className="p-5">
                <p className="prompt-q">
                  Soft launch or hard launch person?
                </p>
                <p className="prompt-a mt-3 text-sm leading-relaxed">
                  Soft launch. Then a blurry photo. Then nothing for a month.
                  Then a wedding invite. That's the order.
                </p>
                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                  <span className="text-[0.65rem] text-muted tracking-[0.18em] uppercase font-semibold">
                    Hook this prompt
                  </span>
                  <span className="btn-ink text-[0.65rem] py-1.5 px-3">Hook</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex items-center justify-between text-xs text-muted font-medium">
          <span className="eyebrow">No swipes</span>
          <span className="eyebrow hidden sm:inline">No gradients</span>
          <span className="eyebrow">No red hearts</span>
          <span className="eyebrow hidden sm:inline">No vanishing matches</span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Photo carousel — horizontal scroll-snap row of frames with section heading
   ───────────────────────────────────────────────────────────────────────── */
function PhotoCarousel() {
  const frames = [
    "Window seat", "Saturday", "Old Delhi", "Studio",
    "Long walk", "Late night", "Festival", "Backseat"
  ];
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-20 md:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Real evenings</p>
            <h2 className="display text-4xl md:text-5xl mt-4 max-w-md">
              The people, not the profile.
            </h2>
          </div>
          <p className="text-sm text-muted max-w-sm">
            Swipe along to see how members actually use the app — long-form
            answers, real photos, no filters.
          </p>
        </div>
      </div>

      <div className="mt-12 pb-20 md:pb-28">
        <div className="overflow-x-auto no-scrollbar snap-x-strip">
          <div className="flex gap-5 px-6 lg:px-10 min-w-max">
            {frames.map((label, i) => (
              <div
                key={i}
                className="w-[64vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw] flex-none"
              >
                <Frame aspect="4/5" label={label} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Funky statement — white background, oversized type, one word annotated
   ───────────────────────────────────────────────────────────────────────── */
function FunkyStatement() {
  return (
    <section className="border-t border-hairline" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <p className="eyebrow">Our approach</p>

        <h2 className="mt-8 display text-[3.25rem] sm:text-[5rem] md:text-[7rem] lg:text-[8.5rem]">
          Date{" "}
          <span className="inline-block relative">
            <span className="display-italic font-medium">after</span>
            <CircleAnnotation />
          </span>{" "}
          hours.
        </h2>

        <div className="mt-16 grid md:grid-cols-12 gap-10 md:gap-16 items-end">
          <p className="md:col-span-7 text-lg md:text-xl leading-relaxed text-ink/85 max-w-2xl">
            We don't want you living inside the app. We want you off it, on a
            walk in Lodhi Garden with someone whose answer to a prompt made
            you laugh on a Tuesday. The whole product is designed to put you
            out the door faster.
          </p>
          <div className="md:col-span-5 md:text-right space-y-3">
            <Link href="#how" className="btn-ink">How we do it</Link>
            <p className="text-xs text-muted">No swipes. No streaks. No nudges at 11 pm.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Hand-drawn-looking ellipse around the highlighted word in the headline. */
function CircleAnnotation() {
  return (
    <svg
      className="absolute -inset-x-3 -inset-y-2 w-[calc(100%+1.5rem)] h-[calc(100%+1rem)] pointer-events-none"
      viewBox="0 0 200 80"
      fill="none"
      aria-hidden
    >
      <path
        d="M 18 42 C 18 18, 60 8, 105 10 C 160 12, 188 28, 184 46 C 180 64, 138 72, 85 70 C 35 68, 14 56, 18 42 Z"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ vectorEffect: "non-scaling-stroke" }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Three reasons — alternating image + text rows
   ───────────────────────────────────────────────────────────────────────── */
function ThreeReasons() {
  const rows = [
    {
      n: "01",
      title: "Prompts, not poses.",
      body:
        "Every profile is built around three answered questions. Pictures are there, but the front door is what they said. People who can write a sentence about themselves are people worth meeting.",
      label: "Reading"
    },
    {
      n: "02",
      title: "Hook with intent.",
      body:
        "There is no like button. You hook a specific photo or a specific answer — and you can attach a note. Drive-by interest doesn't survive a UI that asks you to be specific.",
      label: "Coffee"
    },
    {
      n: "03",
      title: "Chat that respects time.",
      body:
        "Conversations live as long as two people keep coming back. If she hasn't replied in an hour, nothing on your side burns down. We don't reward addiction; we reward replying well.",
      label: "Walking"
    }
  ];
  return (
    <section id="how" className="border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="max-w-3xl mb-20">
          <p className="eyebrow">How it works</p>
          <h2 className="display text-4xl md:text-6xl mt-5">
            Three small design choices.
          </h2>
        </div>

        <ol className="space-y-24 md:space-y-32">
          {rows.map((r, i) => {
            const flipped = i % 2 === 1;
            return (
              <li
                key={r.n}
                className={
                  "grid md:grid-cols-12 gap-10 md:gap-16 items-center " +
                  (flipped ? "md:[direction:rtl]" : "")
                }
              >
                <div className={"md:col-span-6 " + (flipped ? "md:[direction:ltr]" : "")}>
                  <Frame aspect="4/5" label={r.label} />
                </div>
                <div className={"md:col-span-6 " + (flipped ? "md:[direction:ltr]" : "")}>
                  <p className="text-muted font-mono text-sm">{r.n}</p>
                  <h3 className="display text-3xl md:text-5xl mt-3">{r.title}</h3>
                  <p className="mt-6 text-ink/85 max-w-prose2 leading-relaxed text-lg">
                    {r.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Prompt showcase — text cards mixed with photo frames
   ───────────────────────────────────────────────────────────────────────── */
function PromptShowcase() {
  type Item =
    | { type: "prompt"; q: string; a: string }
    | { type: "photo"; label: string };
  const items: Item[] = [
    { type: "prompt", q: "We'll get along if…", a: "You have a strong opinion about chai and you're willing to defend it." },
    { type: "photo", label: "Sunlight" },
    { type: "prompt", q: "A green flag I look for…", a: "Texts back at a normal speed. No three-minute essays, no three-day silences." },
    { type: "prompt", q: "I'm weirdly good at…", a: "Parallel parking on the first try. Auto rickshaw negotiations. Crying at songs in languages I don't speak." },
    { type: "photo", label: "Window seat" },
    { type: "prompt", q: "I go quiet when…", a: "I'm reading something I love. Ask me what it is — I want to tell you." },
    { type: "prompt", q: "An unpopular opinion I'll die on", a: "Bombay is just one really long beach with a city draped over it." },
    { type: "photo", label: "At home" },
    { type: "prompt", q: "The way to my heart is…", a: "Show up with mangoes in May. Don't make a thing of it." }
  ];
  return (
    <section id="prompts" className="border-t border-hairline bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">From the prompt bank</p>
            <h2 className="display text-4xl md:text-6xl mt-4 max-w-xl">
              Real answers, from real people.
            </h2>
          </div>
          <p className="text-sm text-muted max-w-sm">
            Every profile picks three. The questions don't change — the
            answers do all the work.
          </p>
        </div>

        <ul className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <li key={i}>
              {it.type === "prompt" ? (
                <div className="card-line p-6 md:p-7 h-full">
                  <p className="prompt-q">{it.q}</p>
                  <p className="prompt-a mt-5">{it.a}</p>
                </div>
              ) : (
                <Frame aspect="4/5" label={it.label} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Pull quote — testimonial with portrait beside it
   ───────────────────────────────────────────────────────────────────────── */
function PullQuote() {
  return (
    <section id="voices" className="border-t border-hairline" style={{ background: "var(--ink)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32 text-bone">
        <p className="eyebrow" style={{ color: "rgba(243,240,233,0.5)" }}>What people say</p>

        <div className="mt-10 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <figure className="lg:col-span-8">
            <blockquote className="display text-3xl md:text-5xl leading-[1.05] text-bone">
              I deleted four apps before I tried this one. The thing I didn't
              expect was that I read every profile before I hooked. That's
              <span className="display-italic font-medium"> never </span>
              happened to me on a dating app before.
            </blockquote>
            <figcaption className="mt-10 text-sm" style={{ color: "rgba(243,240,233,0.65)" }}>
              <span className="eyebrow" style={{ color: "inherit" }}>Reema · Bombay</span>
            </figcaption>
          </figure>
          <div className="lg:col-span-4">
            <Frame aspect="4/5" label="Reader" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Closing CTA
   ───────────────────────────────────────────────────────────────────────── */
function ClosingCta() {
  return (
    <section id="safety" className="border-t border-hairline bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <p className="eyebrow">Ready</p>
            <h2 className="display text-4xl md:text-7xl mt-4 max-w-3xl">
              Bring your voice. We'll find your reader.
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
          <Link href="/" className="font-extrabold text-2xl tracking-[-0.04em]">Hooked.</Link>
          <p className="mt-5 max-w-sm text-sm text-muted leading-relaxed">
            A quieter dating app. Prompts over poses, hooks over swipes, and
            conversations that don't time out on you.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-4">App</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="#how">How it works</Link></li>
            <li><Link href="#prompts">Prompts</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-4">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="#voices">Voices</Link></li>
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
          <span>© {year} Hooked.</span>
          <span>Made in India.</span>
        </div>
      </div>
    </footer>
  );
}
