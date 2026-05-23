import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { ReplyComposer } from "./reply";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConfessionDetail({ params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) redirect("/login");

  const c = await db.confession.findUnique({
    where: { id: params.id },
    include: { replies: { where: { approved: true }, orderBy: { createdAt: "asc" } } }
  });
  if (!c || !c.approved) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 lg:px-10 py-12">
        <Link href="/confessions" className="btn-quiet">Back</Link>
        <article className="mt-8 card-line p-7">
          <p className="prompt-a">{c.body}</p>
        </article>

        <section className="mt-10">
          <p className="eyebrow">Anonymous replies</p>
          <ul className="mt-5 space-y-4">
            {c.replies.length === 0 && (
              <li className="text-muted serif italic text-lg">Nothing yet.</li>
            )}
            {c.replies.map((r) => (
              <li key={r.id} className="border-l border-hairline pl-4">
                <p>{r.body}</p>
              </li>
            ))}
          </ul>
          <ReplyComposer confessionId={c.id} />
        </section>
      </div>
    </AppShell>
  );
}
