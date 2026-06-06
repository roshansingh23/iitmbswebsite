import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollNav } from "@/components/scroll-nav";
import { DownloadBanner } from "@/components/download-banner";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const HERO_IMAGE = "https://ceranna.com/wp-content/uploads/2017/03/mg_7929.jpg";

export default async function Landing() {
  // Signed-in users have no reason to see the marketing page — send them
  // into the app. Keeps a stray hit on "/" (e.g. after a desktop/mobile
  // view toggle) from stranding them on the homepage. redirect() is kept
  // outside the try so its internal throw isn't swallowed.
  let authed = false;
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    authed = !!user;
  } catch {}
  if (authed) redirect("/discover");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ScrollNav />
      <main>
        <Hero />
        <Statement />
        <LabsBlock />
        <DarkTestimonial />
      </main>
      <SiteFooter />
      <DownloadBanner />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero — full viewport height, photo edge-to-edge
   ───────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Reusable image frame for the smaller slots below the hero
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
      className={"bg-tint border border-hairline relative overflow-hidden rounded-[4px] " + className}
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
   Statement
   ───────────────────────────────────────────────────────────────────────── */
function Statement() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-36">
        <div className="max-w-3xl">
          <p
            style={{
              fontSize: "0.85rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontWeight: 600
            }}
          >
            Our approach
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display-serif), Georgia, serif",
              fontWeight: 400,
              letterSpacing: "-0.015em",
              lineHeight: 1.04
            }}
            className="mt-10 text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7rem]"
          >
            Stay{" "}
            <span className="inline-block relative">
              long
              <CircleAnnotation />
            </span>{" "}
            enough <br/> to mean it.
          </h2>

          <div className="mt-14">
            <CurlyArrow className="mb-6" />
            <Link
              href="#how"
              className="inline-flex items-center justify-center gap-2 bg-ink text-white rounded-full font-semibold transition hover:opacity-90"
              style={{
                padding: "1.1rem 2.25rem",
                fontSize: "0.95rem",
                letterSpacing: "0.04em"
              }}
            >
              How we do it
            </Link>
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
   Photo-left, text-right block
   ───────────────────────────────────────────────────────────────────────── */
function LabsBlock() {
  return (
    <section id="how" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-center">
          <div className="md:col-span-6">
            <Frame aspect="4/3" label="Studio" />
          </div>
          <div className="md:col-span-6">
            <p className="eyebrow">Inside Mismatched.</p>
            <h2 className="mt-4 display text-4xl md:text-5xl lg:text-6xl">
              We read every<br/>
              <span className="display-italic font-medium">first message.</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Dark testimonial
   ───────────────────────────────────────────────────────────────────────── */
function DarkTestimonial() {
  return (
    <section style={{ background: "var(--ink)" }}>
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
   Footer — no top border
   ───────────────────────────────────────────────────────────────────────── */
function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "#000" }} className="text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="font-extrabold text-2xl tracking-[-0.04em] text-white">
            Mismatched.
          </Link>
        </div>

        <div className="md:col-span-2">
          <p
            className="mb-3"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600
            }}
          >
            App
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white/70 transition">Sign in</Link></li>
            <li><Link href="/login" className="hover:text-white/70 transition">Join now</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p
            className="mb-3"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600
            }}
          >
            Company
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/careers" className="hover:text-white/70 transition">Careers</Link></li>
            <li><Link href="/press" className="hover:text-white/70 transition">Press</Link></li>
            <li><Link href="/safety" className="hover:text-white/70 transition">Safety</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p
            className="mb-3"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 600
            }}
          >
            Legal
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-white/70 transition">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-white/70 transition">Privacy</Link></li>
            <li><Link href="/community" className="hover:text-white/70 transition">Community guidelines</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-14 flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
        <span>© {year} Mismatched.</span>
        <span>Made in India.</span>
      </div>
    </footer>
  );
}
