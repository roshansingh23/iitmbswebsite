export const metadata = { title: "Community guidelines" };

export default function CommunityPage() {
  return (
    <article>
      <p className="eyebrow">Community guidelines</p>
      <h1 className="display text-4xl md:text-6xl mt-3">How we behave here.</h1>

      <div className="mt-12 space-y-10 text-base leading-relaxed">
        <Section title="Be a real person">
          One account per human. Photos of you, name you go by, age you actually are. Catfishing is the fastest way out the door.
        </Section>
        <Section title="No harassment">
          If someone passes on you, that's the answer. Don't make new accounts. Don't message off-platform to keep pushing.
        </Section>
        <Section title="No solicitation">
          This isn't a marketplace. No promos, no escort services, no chain DMs.
        </Section>
        <Section title="Hate has no room">
          Slurs, dehumanising language, and targeted prejudice get accounts banned without warning.
        </Section>
        <Section title="When in doubt">
          Report it. Block them. We read every report.
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
