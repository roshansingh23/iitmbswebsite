export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article>
      <p className="eyebrow">Terms of use</p>
      <h1 className="display text-4xl md:text-6xl mt-3">The deal.</h1>
      <p className="mt-8 text-muted text-sm">Last updated — placeholder. Replace with your lawyer's version before launch.</p>

      <div className="mt-12 space-y-10 text-base leading-relaxed">
        <Section title="Who can sign up">
          You must be at least 18 years old, and you must use your own real email and your own real photos. Signing up on behalf of someone else, or with a fake identity, is not allowed.
        </Section>
        <Section title="What you can post">
          Prompt answers and photos must be your own. No nudity, no harassment, no hate. Profiles violating this get removed; repeat offenders get banned.
        </Section>
        <Section title="Hooks and matches">
          A hook is an interest signal, not a commitment. A match doesn't obligate either party to keep the conversation going.
        </Section>
        <Section title="Safety">
          Block and report are always free. If something on the app feels unsafe, tell us. We will act.
        </Section>
        <Section title="Termination">
          We may suspend or remove accounts that violate these terms. You may delete your account at any time by emailing privacy@mismatched.space.
        </Section>
        <Section title="Contact">
          legal@mismatched.space
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
