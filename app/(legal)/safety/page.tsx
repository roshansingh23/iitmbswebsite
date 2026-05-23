export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <article>
      <p className="eyebrow">Safety</p>
      <h1 className="display text-4xl md:text-6xl mt-3">Always free. Always on.</h1>

      <div className="mt-12 space-y-10 text-base leading-relaxed">
        <Section title="Block and unmatch">
          Both are one tap from any profile or conversation. Blocking removes all existing hooks between you and the other person, and hides each profile from the other.
        </Section>
        <Section title="Report">
          You can report a profile, a message, a confession, or a reply. Reports go to a real human within a working day.
        </Section>
        <Section title="Verification">
          We offer a verification badge via ID and selfie check. It's optional but it shows on your profile and signals trust to others.
        </Section>
        <Section title="Meeting up">
          Tell a friend where you're going. Meet somewhere public the first time. If the other person resists, that's the signal.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="display text-2xl">{title}</h2>
      <p className="mt-3 max-w-prose2">{children}</p>
    </section>
  );
}
