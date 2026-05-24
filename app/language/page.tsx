import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageGuide } from "./guide";

export const metadata = {
  title: "The Language of Love",
  description: "A love guru's field guide to understanding her and understanding him — how to talk online, in person, and how to read the hints."
};

const ACCENT = "#6D1F4E";

export default function LanguagePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-5xl h-14 px-6 flex items-center gap-3">
          <Link href="/" aria-label="Back" className="p-2 -ml-2 text-ink active:scale-95 transition">
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <Link href="/" className="font-extrabold text-lg tracking-[-0.045em]">Mismatched.</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <div className="max-w-2xl">
          <p className="eyebrow" style={{ color: ACCENT }}>The language of love</p>
          <h1 className="mt-3 font-extrabold text-4xl md:text-5xl tracking-[-0.045em] leading-[1.05]">
            Love, decoded.
          </h1>
          <p className="mt-5 text-ink/80 text-lg leading-relaxed">
            Pull up a chair. After years of watching people fall for each other — and
            just as many fumble it — let me tell you the truth: attraction isn't a
            mystery, it's a language. Most of us are fluent in our own and clueless in
            the other's. So I'll translate, plainly, for both sides.
          </p>
          <p className="mt-4 text-sm text-muted md:hidden">
            Tap <b>Her</b> or <b>Him</b> at the bottom to switch whose language you're learning.
          </p>
          <p className="mt-4 text-sm text-muted hidden md:block">
            Her on the left, him on the right — read whichever you're trying to understand.
          </p>
        </div>

        <LanguageGuide />

        <p className="mt-14 max-w-2xl text-sm text-muted leading-relaxed border-l-2 pl-4" style={{ borderColor: ACCENT }}>
          One last thing from your resident love guru: these are <i>tendencies</i>, not
          laws. Every person is their own dialect — gender is just the accent they
          started with. Use this to pay closer attention, then actually listen. That's
          the entire secret.
        </p>

        <div className="mt-8">
          <Link href="/login" className="btn-ink inline-flex">Go find your person</Link>
        </div>
      </main>
    </div>
  );
}
