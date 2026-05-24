import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "The Language of Love",
  description: "Understanding what someone means — not just what they say. A field guide to reading people, decoding hints, and connecting for real."
};

const ACCENT = "#6D1F4E";

export default function LanguagePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-10">
        <p className="eyebrow" style={{ color: ACCENT }}>The language of love</p>
        <h1 className="mt-3 font-extrabold text-4xl md:text-5xl tracking-[-0.045em] leading-[1.05]">
          Love, decoded.
        </h1>
        <p className="mt-5 text-muted text-lg leading-relaxed">
          Attraction is rarely about grand gestures. It's about attention, timing,
          and reading the quiet signals most people miss. This is a field guide to
          understanding what someone <em>means</em> — not just what they say.
        </p>

        {/* Understanding Her */}
        <Section title="Understanding her" tag="For the guys">
          <Block heading="What she actually values">
            <Bullet><b>Being seen, not just complimented.</b> "You're beautiful" is nice. "You always go quiet when something's bothering you — what's up?" lands deeper.</Bullet>
            <Bullet><b>Consistency over intensity.</b> Showing up reliably beats one big romantic burst followed by silence. Trust is built in small, repeated moments.</Bullet>
            <Bullet><b>Emotional safety.</b> She opens up when she's sure you won't mock it, dismiss it, or use it against her later.</Bullet>
          </Block>
          <Block heading="What she really wants">
            <Bullet>To be chosen <i>on purpose</i> — not by default, not because you were bored.</Bullet>
            <Bullet>A partner who listens to understand, not to reply or to fix.</Bullet>
            <Bullet>Effort that's thoughtful, not expensive. Remembering beats spending.</Bullet>
          </Block>
          <Block heading="How to read her hints">
            <Bullet><b>"I'm fine"</b> with a pause usually means not fine. Don't fix it — ask gently and just be present.</Bullet>
            <Bullet><b>She shares small daily details</b> (a coworker, a song, a tiny win)? That's her letting you into her world. Engage with them.</Bullet>
            <Bullet><b>Future-talk</b> ("we should go there sometime") is her checking whether you're imagining the same thing.</Bullet>
          </Block>
          <Block heading="How to impress her">
            <Bullet>Remember the things she mentioned only once.</Bullet>
            <Bullet>Be decisive about plans — indecision reads as disinterest.</Bullet>
            <Bullet>Make her laugh and feel safe in the same conversation.</Bullet>
          </Block>
        </Section>

        {/* Understanding Him */}
        <Section title="Understanding him" tag="For the girls">
          <Block heading="What he actually values">
            <Bullet><b>Respect and genuine appreciation</b> for his effort — said out loud, not assumed.</Bullet>
            <Bullet><b>Ease.</b> A space where he isn't being managed, tested, or quizzed.</Bullet>
            <Bullet><b>Directness.</b> Hints frequently sail right past him. Clear words land.</Bullet>
          </Block>
          <Block heading="What he really wants">
            <Bullet>To feel like he makes you happy — many men express love by <i>doing</i>, so let him.</Bullet>
            <Bullet>Real interest in his world, not just his usefulness.</Bullet>
            <Bullet>Affection and acknowledgment — not only problems handed to him to solve.</Bullet>
          </Block>
          <Block heading="How to read his hints">
            <Bullet><b>He goes quiet</b> — usually processing, not withdrawing. Give him room, then re-open the door.</Bullet>
            <Bullet><b>He does practical things</b> (fixes, drives, plans, shows up)? That's often his entire love language.</Bullet>
            <Bullet><b>Teasing and banter</b> is comfort and affection, not disinterest.</Bullet>
          </Block>
          <Block heading="How to impress him">
            <Bullet>Say how you feel plainly — he's probably not decoding subtext.</Bullet>
            <Bullet>Appreciate his effort where he can hear it.</Bullet>
            <Bullet>Keep your own world and friends. Independence is magnetic.</Bullet>
          </Block>
        </Section>

        {/* Signs */}
        <Section title="Is it mutual?" tag="The honest signals">
          <Block heading="Signs they're genuinely into you">
            <Bullet>They make plans, not just conversation. Interest creates time.</Bullet>
            <Bullet>They remember your details and bring them back up later.</Bullet>
            <Bullet>They're a little nervous, a little extra — people perform when they care.</Bullet>
            <Bullet>Their words and actions agree. Believe the pattern, not the promise.</Bullet>
          </Block>
          <Block heading="Reading mixed signals">
            <Bullet><b>Match energy, don't chase.</b> If effort is one-sided, that one-sidedness <i>is</i> the answer.</Bullet>
            <Bullet><b>Silence is data.</b> Don't fill it with hopeful assumptions — ask.</Bullet>
            <Bullet><b>"Busy" forever means no.</b> People find time for what matters to them.</Bullet>
          </Block>
        </Section>

        {/* Universal */}
        <Section title="Works on everyone" tag="The fundamentals">
          <Block heading="The quiet superpowers">
            <Bullet><b>Curiosity beats performance.</b> Ask better questions; stop auditioning.</Bullet>
            <Bullet><b>Consistency builds trust faster than charisma.</b></Bullet>
            <Bullet><b>Be the calmest person in the conversation.</b> Regulated is attractive.</Bullet>
            <Bullet><b>Make them feel, don't make them think about you.</b> Emotions are what people remember.</Bullet>
          </Block>
        </Section>

        <p className="mt-12 text-sm text-muted leading-relaxed border-l-2 pl-4" style={{ borderColor: ACCENT }}>
          A note from your resident love guru: these are <i>tendencies</i>, not laws.
          Every person is their own dialect — gender is a starting accent, not a script.
          Use this to pay closer attention, then actually listen. That's the whole secret.
        </p>

        <div className="mt-10">
          <Link href="/login" className="btn-ink inline-flex">Find your person</Link>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-hairline">
      <div className="mx-auto max-w-2xl h-14 px-6 flex items-center gap-3">
        <Link href="/" aria-label="Back" className="p-2 -ml-2 text-ink active:scale-95 transition">
          <ArrowLeft size={20} strokeWidth={2} />
        </Link>
        <Link href="/" className="font-extrabold text-lg tracking-[-0.045em]">Mismatched.</Link>
      </div>
    </header>
  );
}

function Section({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <p className="eyebrow" style={{ color: ACCENT }}>{tag}</p>
      <h2 className="mt-2 font-extrabold text-2xl md:text-3xl tracking-[-0.03em]">{title}</h2>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="card-line p-5">
      <h3 className="font-semibold text-lg">{heading}</h3>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[0.95rem] leading-relaxed">
      <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACCENT }} />
      <span>{children}</span>
    </li>
  );
}
