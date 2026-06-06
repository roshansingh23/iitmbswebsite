export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="prose-styled">
      <p className="eyebrow">Privacy policy</p>
      <h1 className="display text-4xl md:text-6xl mt-3">How we handle your data.</h1>
      <p className="mt-8 text-muted text-sm">Last updated — placeholder. Replace with your reviewed copy before launch.</p>

      <div className="mt-12 space-y-10 text-base leading-relaxed">
        <Section title="What we collect">
          We collect the email you sign in with, the answers you write into prompts, the photos you upload, and the metadata that makes the app work (when you sent a hook, when a conversation last had activity, the device session that's signed in).
        </Section>
        <Section title="What we never do">
          We don't sell your data. We don't show your photos to ad networks. We don't share who you hooked or who hooked you with anyone other than the parties involved.
        </Section>
        <Section title="Who can see your profile">
          Only signed-in members whose preferences match yours. If you pause your profile, no one sees it until you turn pause off.
        </Section>
        <Section title="Deleting your account">
          Email us. We hard-delete your photos and prompt answers within seven days; anonymised aggregate metrics may be retained for safety analysis.
        </Section>
        <Section title="Contact">
          privacy@mismatched.space
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
