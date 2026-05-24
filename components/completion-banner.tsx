import Link from "next/link";

// Light-pink completion nudge. Shown when the signed-in user's profile is
// missing photos or has fewer than three answered prompts.
export function CompletionBanner() {
  return (
    <div
      className="rounded-2xl px-5 py-5 mx-4 mb-4"
      style={{ background: "#FCE8E4" }}
    >
      <p className="text-center text-ink/85 text-sm leading-relaxed">
        Complete your profile to send and receive
        <br />
        messages, hooks, and roses.
      </p>
      <div className="mt-4 flex justify-center">
        <Link
          href="/me"
          className="px-6 py-2.5 rounded-full bg-white text-ink font-semibold text-sm"
        >
          Edit profile
        </Link>
      </div>
    </div>
  );
}
