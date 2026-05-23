import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Statement />
        <LabsBlock />
        <DarkTestimonial />
        <TeamBlock />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Empty image frame
   ───────────────────────────────────────────────────────────────────────── */
function Frame({
  aspect = "4/5",
  label = "Photo",
  className = "",
  rounded = true
}: {
  aspect?: string;
  label?: string;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={
        "bg-tint border border-hairline relative overflow-hidden " +
        (rounded ? "rounded-[4px] " : "") +
        className
      }
      style={{ aspectRatio: aspect, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
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
   Nav — minimal. Brand left, Get the app right. Nothing in the middle.
   ───────────────────────────────────────────────────────────────────────── */
function SiteHeader() {
  return (
    <header className="border-b border-hairline bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl tracking-[-0.04em]">
          Hooked.
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden sm:inline text-sm font-medium hover:text-muted transition">
            Sign in
          </Link>
          <Link href="/login" className="btn-ink">Get the app</Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero — one full-bleed image frame, nothing layered over it.
   ───────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-10 pb-16 md:pt-14 md:pb-24">
        <Frame aspect="16/9" label="Hero" rounded />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Statement section — "Date after hours." with hand-drawn circle
   ───────────────────────────────────────────────────────────────────────── */
function Statement() {
  return (
    <section className="bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <div className="max-w-4xl">
          <p className="eyebrow">Our approach</p>
          <h2 className="mt-8 display text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem]">
            Date{" "}
            <span className="inline-block relative">
              <span className="display-italic font-medium">after</span>
              <CircleAnnotation />
            </span>{" "}
            hours.
          </h2>

          <div className="mt-14 flex flex-col md:flex-row md:items-end md:gap-10">
            <CurlyArrow className="hidden md:block shrink-0 -translate-y-2" />
            <p className="md:flex-1 max-w-xl text-base md:text-lg leading-relaxed text-ink/85">
              We don't want you living inside the app. We want you off it, on
              a walk in Lodhi Garden with someone whose answer to a prompt
              made you laugh on a Tuesday. The whole product is designed to
              put you out the door faster.
            </p>
          </div>

          <div className="mt-10">
            <Link href="#how" className="btn-ink">How we do it</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

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

function CurlyArrow({ className = "" }: { className?: string }) {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" className={className} aria-hidden>
      <path
        d="M 8 8 C 14 26, 28 38, 44 42 C 56 45, 64 44, 72 40"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 72 40 L 64 36 M 72 40 L 66 46"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   "Labs"-style block: photo on left, eyebrow + heading + paragraph on right
   ───────────────────────────────────────────────────────────────────────── */
function LabsBlock() {
  return (
    <section id="how" className="bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-6">
            <Frame aspect="4/3" label="Studio" />
          </div>
          <div className="md:col-span-6">
            <p className="eyebrow">Inside Hooked.</p>
            <h2 className="mt-4 display text-4xl md:text-5xl lg:text-6xl">
              We read every<br/>
              <span className="display-italic font-medium">first message.</span>
            </h2>
            <p className="mt-6 text-ink/85 max-w-prose2 leading-relaxed text-base md:text-lg">
              A small team reads anonymised opening messages every week to
              find what works — and to weed out what shouldn't be on a
              dating app at all. The work isn't glamorous; it's why the room
              stays the way it is.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Dark testimonial block
   ───────────────────────────────────────────────────────────────────────── */
function DarkTestimonial() {
  return (
    <section className="border-t border-hairline" style={{ background: "var(--ink)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32 text-white">
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.55)" }}>What people say</p>
        <figure className="mt-10 max-w-4xl">
          <div className="text-4xl text-white/60 leading-none">"</div>
          <blockquote className="mt-2 display text-2xl md:text-4xl leading-[1.15] text-white font-bold">
            I deleted four apps before I tried this one. The thing I didn't
            expect was that I read every profile before I hooked. That's
            <span className="display-italic font-medium"> never </span>
            happened to me on a dating app before.
          </blockquote>
          <figcaption className="mt-10 text-sm font-semibold text-white">
            Reema · Bombay
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   "Work with us" block — heading on left, photo strip on right
   ───────────────────────────────────────────────────────────────────────── */
function TeamBlock() {
  return (
    <section className="bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-end">
          <div className="md:col-span-5">
            <p className="eyebrow">Build with us</p>
            <h2 className="mt-4 display text-4xl md:text-5xl lg:text-6xl">
              Let's make<br/>
              <span className="display-italic font-medium">dating boring again.</span>
            </h2>
            <p className="mt-6 text-ink/85 max-w-md leading-relaxed">
              We're looking for engineers, designers, and trust-and-safety
              people who think dating apps are mostly bad and want to help
              fix one. Six people, hiring two more.
            </p>
            <Link href="/careers" className="btn-ink mt-8">Join us</Link>
          </div>

          <div className="md:col-span-7 grid grid-cols-3 gap-3 md:gap-4">
            <Frame aspect="1/1" label="Standup" />
            <Frame aspect="1/1" label="Lunch" />
            <Frame aspect="1/1" label="Whiteboard" />
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
    <footer className="bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="font-extrabold text-2xl tracking-[-0.04em]">Hooked.</Link>
          <p className="mt-5 max-w-sm text-sm text-muted leading-relaxed">
            A quieter dating app. Prompts over poses, hooks over swipes,
            conversations that don't time out on you.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-3">App</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login">Sign in</Link></li>
            <li><Link href="/login">Get the app</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/careers">Careers</Link></li>
            <li><Link href="/press">Press</Link></li>
            <li><Link href="/safety">Safety</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow mb-3">Legal</p>
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
