import Link from "next/link";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md">
        <p className="eyebrow">Check your inbox</p>
        <h1 className="display text-5xl mt-4">A link is on the way.</h1>
        <p className="mt-6 text-muted">
          Open the email we just sent and tap the sign-in link. It expires in 24 hours.
        </p>
        <Link href="/login" className="btn-quiet mt-10 inline-flex">Back to sign in</Link>
      </div>
    </div>
  );
}
