"use client";

import { useState } from "react";

const ACCENT = "#6D1F4E";

type Sub = { heading: string; lead?: string; points: React.ReactNode[] };
type Column = { who: "her" | "him"; title: string; intro: string; subs: Sub[] };

const HER: Column = {
  who: "her",
  title: "Understanding her",
  intro:
    "First thing, and hear me on this: she isn't testing you to be difficult. She's testing because she's quietly deciding whether she's safe with you. Almost everything below comes back to that one word — safety. Give her that, and the walls come down on their own.",
  subs: [
    {
      heading: "When you're texting her",
      lead: "Online, she reads tone — not just words. A dry \"ok\" can quietly undo a great evening.",
      points: [
        <>Match her effort, then add a little warmth. Don't send paragraphs to her one-liners, but don't leave her on a cold cliffhanger either.</>,
        <>Reference the thing she mentioned yesterday. <i>\"How'd the presentation go?\"</i> beats <i>\"wyd\"</i> every single time — it tells her you were actually listening.</>,
        <>Never double- or triple-text into her silence. Say one good thing, then let her come back to you. Pressure reads as need; patience reads as confidence.</>,
        <>Banter is good. Walls of seriousness this early are not. Keep it light until she opens the deeper door.</>
      ]
    },
    {
      heading: "When you're face to face",
      lead: "In person is where you actually win or lose it. Presence is your whole game.",
      points: [
        <>Put the phone away. She clocks it instantly, and nothing says \"you matter\" louder than your undivided attention.</>,
        <>Listen to understand her feelings, not to fix her problem. When in doubt, ask: <i>\"do you want advice, or do you just want me to listen?\"</i></>,
        <>Small specific gestures hit hardest — her usual chai order remembered, noticing she's cold before she says it.</>,
        <>Be calm and decisive about plans. Indecision feels like indifference to her.</>
      ]
    },
    {
      heading: "Reading her hints",
      lead: "She rarely says the big thing directly. She shows you and waits to see if you notice.",
      points: [
        <><b>\"I'm fine\"</b> said flatly means she is not fine. Don't interrogate — sit close and ask gently.</>,
        <>She goes <b>quiet or short</b>? Something's off and she's waiting to see if you'll catch it.</>,
        <>She drops <b>future-talk</b> — <i>\"we should go there sometime\"</i> — she's already imagining you in it.</>,
        <>She <b>introduces you to her friends</b>: that's a real checkpoint. You passed.</>
      ]
    },
    {
      heading: "What she's really after",
      points: [
        <><b>Consistency.</b> The same energy on day 40 as day 4. Intensity is cheap; reliability is rare.</>,
        <>To feel <b>chosen on purpose</b> — not by convenience, not because you were bored.</>,
        <>A man who is steady, sure, and kind — a partner, not a project she has to repair.</>
      ]
    }
  ]
};

const HIM: Column = {
  who: "him",
  title: "Understanding him",
  intro:
    "Here's the secret nobody tells you about him: he usually shows love instead of saying it. If you're waiting for a speech, you might miss that he just spent an hour fixing your bike in the rain. That was the speech. Learn to read the doing, and you'll understand him completely.",
  subs: [
    {
      heading: "When you're texting him",
      lead: "Online, take him literally. He's usually not hiding a paragraph of subtext under \"sounds good.\"",
      points: [
        <>He can be a <b>bad texter and a great partner</b> at the same time. Texting often isn't his love language — don't grade his heart on his reply speed.</>,
        <>Be direct. <i>\"I'd love to see you this weekend\"</i> works far better than dropping a hint and hoping he decodes it. He probably won't.</>,
        <>If he's short over text, it's rarely drama — he's just not a screen guy. Save the real stuff for in person.</>,
        <>A little warmth goes a long way: tell him you're looking forward to seeing him. Men are rarely told that, and it lands hard.</>
      ]
    },
    {
      heading: "When you're face to face",
      lead: "He opens up shoulder-to-shoulder more than face-to-face. Do something together and watch him talk.",
      points: [
        <>Appreciate his effort <b>out loud</b>. <i>\"I noticed you did that — thank you\"</i> fuels him more than you'd believe.</>,
        <>Give him a beat when he goes quiet. He often processes <b>internally</b> before he can put it into words.</>,
        <>Bond over an activity — a drive, a walk, a game, cooking. Side-by-side lowers his guard.</>,
        <>Don't manage or test him. Ease is what makes him want to stay.</>
      ]
    },
    {
      heading: "Reading his hints",
      lead: "His love is in his actions. Translate the doing and you've cracked the code.",
      points: [
        <>He <b>does practical things</b> for you — drives, fixes, plans, shows up. That's him saying \"I care\" in his native tongue.</>,
        <>He <b>goes quiet</b>? Usually processing, not pulling away. Don't assume the worst and spiral.</>,
        <>He <b>teases and jokes</b> with you — that's comfort and affection, not disrespect.</>,
        <>He <b>makes future plans</b> or brings you into his circle: he's serious, even if he hasn't made the announcement.</>
      ]
    },
    {
      heading: "What he's really after",
      points: [
        <>To feel <b>respected</b> and like he genuinely makes you happy.</>,
        <><b>Ease</b> — a relationship that feels like relief, not another performance review.</>,
        <>Real interest in <i>him</i> — his world, his thoughts — not only in what he can provide.</>
      ]
    }
  ]
};

export function LanguageGuide() {
  const [who, setWho] = useState<"her" | "him">("her");

  return (
    <div className="mt-12">
      <div className="md:grid md:grid-cols-2 md:gap-12 pb-24 md:pb-0">
        <GuideColumn col={HER} visible={who === "her"} />
        <GuideColumn col={HIM} visible={who === "him"} />
      </div>

      {/* Mobile floating capsule — pick whose language you're learning. */}
      <div
        className="md:hidden fixed left-1/2 -translate-x-1/2 z-50"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
      >
        <div
          className="inline-flex rounded-full p-1"
          style={{ background: "#0a0a0a", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}
        >
          <CapsuleButton active={who === "her"} onClick={() => setWho("her")}>Her</CapsuleButton>
          <CapsuleButton active={who === "him"} onClick={() => setWho("him")}>Him</CapsuleButton>
        </div>
      </div>
    </div>
  );
}

function CapsuleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"px-7 py-2.5 rounded-full text-sm font-semibold transition-colors " + (active ? "text-white" : "text-white/55")}
      style={active ? { background: ACCENT } : undefined}
    >
      {children}
    </button>
  );
}

function GuideColumn({ col, visible }: { col: Column; visible: boolean }) {
  return (
    <article className={(visible ? "block" : "hidden") + " md:block"}>
      <div className="flex items-baseline gap-2">
        <h2 className="font-extrabold text-2xl md:text-3xl tracking-[-0.03em]">{col.title}</h2>
      </div>
      <p className="mt-4 text-[1.02rem] leading-relaxed text-ink/80">{col.intro}</p>

      <div className="mt-8 space-y-9">
        {col.subs.map((s) => (
          <div key={s.heading}>
            <h3 className="font-semibold text-lg" style={{ color: ACCENT }}>{s.heading}</h3>
            {s.lead && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted italic">{s.lead}</p>}
            <ul className="mt-3 space-y-2.5">
              {s.points.map((p, i) => (
                <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: ACCENT }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
