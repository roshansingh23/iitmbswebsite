import Link from "next/link";

export const metadata = { title: "Press" };

export default function PressPage() {
  return (
    <article>
      <p className="eyebrow">Press</p>
      <h1 className="display text-4xl md:text-6xl mt-3">For media enquiries.</h1>
      <p className="mt-8 text-base leading-relaxed max-w-prose2">
        We respond to all serious press requests. Send a short note about
        what you're working on and your deadline.
      </p>
      <a href="mailto:press@mismatched.space" className="btn-ink mt-10">press@mismatched.space</a>
      <Link href="/" className="btn-quiet mt-10 ml-6 inline-flex">Back home</Link>
    </article>
  );
}
