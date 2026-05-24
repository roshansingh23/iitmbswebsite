import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Voices — the words we date by",
  description: "Modern dating has its own dictionary. Situationship, soft launch, beige flag, rizz — here's the cheat sheet."
};

const ACCENT = "#6D1F4E";

type Term = { word: string; def: string };
type Group = { title: string; terms: Term[] };

const GROUPS: Group[] = [
  {
    title: "The stages",
    terms: [
      { word: "Talking stage", def: "The early, undefined chatting phase — you're vibing, nothing's official, anything could happen." },
      { word: "Situationship", def: "More than friends, less than a relationship. Real feelings, zero labels, lots of \"so what are we?\"" },
      { word: "DTR", def: "\"Define The Relationship\" — the conversation where you finally put a label on it." },
      { word: "Exclusive", def: "You've agreed to date only each other, even if you're not calling it a relationship yet." }
    ]
  },
  {
    title: "Showing it (or hiding it)",
    terms: [
      { word: "Soft launch", def: "Hinting at a partner online without showing their face — a hand, a coffee, a shadow." },
      { word: "Hard launch", def: "Officially posting your partner. It's real and you want everyone to know." },
      { word: "Going Instagram official", def: "The classic hard launch — they're on your grid now." }
    ]
  },
  {
    title: "The flags",
    terms: [
      { word: "Green flag", def: "A sign of a healthy, secure partner — communicates, respects boundaries, follows through." },
      { word: "Red flag", def: "A genuine warning sign you shouldn't ignore." },
      { word: "Beige flag", def: "A quirk that's neither good nor bad — just oddly specific. Mildly sus, mostly funny." }
    ]
  },
  {
    title: "The disappearing acts",
    terms: [
      { word: "Ghosting", def: "Vanishing completely with no explanation. The conversation just... ends." },
      { word: "Slow fade", def: "Replying slower and shorter until it quietly fizzles out — a cowardly ghost." },
      { word: "Breadcrumbing", def: "Tossing just enough attention (a like, a \"hey stranger\") to keep you hooked, never more." },
      { word: "Benching", def: "Keeping you on the sidelines as a backup while they explore other options." },
      { word: "Orbiting", def: "They ghosted you — but still watch every story you post." },
      { word: "Cushioning", def: "Lining up backup options while still in a relationship, in case it ends." },
      { word: "Zombieing", def: "A ghost who rises from the dead, sliding back in like nothing happened." }
    ]
  },
  {
    title: "The feelings",
    terms: [
      { word: "Rizz", def: "Charisma — your ability to charm and flirt. \"Unspoken rizz\" is pulling someone without trying." },
      { word: "The ick", def: "A sudden, irreversible turn-off triggered by something tiny they did. Game over." },
      { word: "Love bombing", def: "Overwhelming affection and intensity early on — often a control tactic, not romance." },
      { word: "Simp", def: "Someone who pours huge effort and attention into a person who isn't reciprocating." },
      { word: "Delulu", def: "Delusional — wildly optimistic about a crush with little evidence. \"Delulu is the solulu.\"" },
      { word: "Catch feelings", def: "To unexpectedly develop real emotions for someone you meant to keep casual." }
    ]
  },
  {
    title: "The scene",
    terms: [
      { word: "Cuffing season", def: "Colder months when everyone suddenly wants to be coupled up and cozy." },
      { word: "Roster", def: "The handful of people someone's casually dating at the same time." },
      { word: "Beige-flagging", def: "Posting such a generic dating profile that you give nothing to react to." },
      { word: "Pocketing", def: "Dating you but hiding you from their friends, family, and feed." },
      { word: "Wokefishing / catfishing", def: "Pretending to be someone (or something) you're not to attract a match." }
    ]
  }
];

export default function VoicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-2xl h-14 px-6 flex items-center gap-3">
          <Link href="/" aria-label="Back" className="p-2 -ml-2 text-ink active:scale-95 transition">
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <Link href="/" className="font-extrabold text-lg tracking-[-0.045em]">Mismatched.</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-10">
        <p className="eyebrow" style={{ color: ACCENT }}>Voices</p>
        <h1 className="mt-3 font-extrabold text-4xl md:text-5xl tracking-[-0.045em] leading-[1.05]">
          The words we date by.
        </h1>
        <p className="mt-5 text-muted text-lg leading-relaxed">
          Modern love comes with its own dictionary. Whether you're decoding a text
          or describing your last situationship, here's the cheat sheet — actually
          up to date.
        </p>

        {GROUPS.map((g) => (
          <section key={g.title} className="mt-12">
            <h2 className="font-extrabold text-2xl tracking-[-0.03em]">{g.title}</h2>
            {g.title === "The stages" && <StagesFlow />}
            {g.title === "The flags" && <FlagSpectrum />}
            {g.title === "The disappearing acts" && <ContactMeter />}
            <dl className="mt-5 space-y-3">
              {g.terms.map((t) => (
                <div key={t.word} className="card-line p-5">
                  <dt className="font-semibold text-base">{t.word}</dt>
                  <dd className="mt-1 text-[0.95rem] leading-relaxed text-muted">{t.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <p className="mt-12 text-sm text-muted leading-relaxed border-l-2 pl-4" style={{ borderColor: ACCENT }}>
          The vocabulary changes every season — but the goal never does. Skip the games,
          say what you mean, and find someone worth being un-ironic with.
        </p>

        <div className="mt-10">
          <Link href="/login" className="btn-ink inline-flex">Start talking</Link>
        </div>
      </main>
    </div>
  );
}

// ── Diagrams ───────────────────────────────────────────────────────────

// Where a modern fling can travel, from undefined to official.
function StagesFlow() {
  const steps = ["Talking stage", "Situationship", "DTR", "Exclusive", "Official"];
  return (
    <div className="mt-5 -mx-1 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 px-1 py-1 w-max">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="px-3.5 py-2 rounded-full border text-xs font-semibold whitespace-nowrap"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {s}
            </div>
            {i < steps.length - 1 && <span aria-hidden style={{ color: ACCENT }}>→</span>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Most people get stuck somewhere in the middle. The whole point is to keep moving right — or move on.</p>
    </div>
  );
}

// The good / weird / bad spectrum.
function FlagSpectrum() {
  return (
    <div className="mt-5 card-line p-5">
      <div
        className="h-3 rounded-full"
        style={{ background: "linear-gradient(to right, #D43A2F 0%, #C9A227 50%, #3FA45B 100%)" }}
      />
      <div className="mt-2 flex justify-between text-xs font-semibold">
        <span style={{ color: "#D43A2F" }}>Red — run</span>
        <span style={{ color: "#9A7B1F" }}>Beige — huh?</span>
        <span style={{ color: "#3FA45B" }}>Green — keep</span>
      </div>
    </div>
  );
}

// How much contact each disappearing act actually leaves you with.
function ContactMeter() {
  const rows = [
    { label: "Ghosting", level: 3, note: "total silence" },
    { label: "Orbiting", level: 18, note: "silent, still watching" },
    { label: "Slow fade", level: 30, note: "less and less" },
    { label: "Benching", level: 42, note: "kept on the bench" },
    { label: "Breadcrumbing", level: 58, note: "crumbs to keep you hooked" }
  ];
  return (
    <div className="mt-5 card-line p-5 space-y-3">
      <p className="text-xs text-muted">How much contact you actually get:</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-24 sm:w-28 text-xs font-semibold shrink-0">{r.label}</span>
          <div className="flex-1 h-2 rounded-full bg-tint overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${r.level}%`, background: ACCENT }} />
          </div>
          <span className="hidden sm:block text-[0.7rem] text-muted w-40 shrink-0">{r.note}</span>
        </div>
      ))}
    </div>
  );
}
