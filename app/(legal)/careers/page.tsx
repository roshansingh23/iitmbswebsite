import Link from "next/link";

export const metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <article>
      <p className="eyebrow">Careers</p>
      <h1 className="display text-4xl md:text-6xl mt-3">Open roles.</h1>
      <p className="mt-6 text-muted">Hiring two more right now.</p>

      <ul className="mt-12 divide-y divide-hairline">
        {[
          { role: "Senior product engineer", where: "Bangalore · hybrid" },
          { role: "Trust & safety lead", where: "Bombay · remote okay" }
        ].map((r) => (
          <li key={r.role} className="py-6 flex items-baseline justify-between">
            <div>
              <h2 className="display text-2xl">{r.role}</h2>
              <p className="text-sm text-muted mt-1">{r.where}</p>
            </div>
            <a href="mailto:careers@mismatched.space" className="btn-line">Apply</a>
          </li>
        ))}
      </ul>

      <p className="mt-16 text-sm text-muted">
        Don't see your role? Write to us at careers@mismatched.space anyway.
      </p>
      <Link href="/" className="btn-quiet mt-10 inline-flex">Back home</Link>
    </article>
  );
}
