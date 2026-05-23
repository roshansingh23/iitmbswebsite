import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ReportRow } from "./row";

export const dynamic = "force-dynamic";

function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (!me.isAdmin && !isAdminEmail(me.email)) redirect("/discover");

  const reports = await db.report.findMany({
    where: { status: "open" },
    include: {
      reporter: { select: { id: true, email: true, name: true } },
      targetUser: { select: { id: true, email: true, name: true } },
      targetMessage: { select: { id: true, body: true, fromUserId: true } },
      targetConfession: { select: { id: true, body: true, authorId: true } },
      targetReply: { select: { id: true, body: true, authorId: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 lg:px-10 py-12">
        <p className="eyebrow">Moderation</p>
        <h1 className="display text-5xl mt-3">Reports queue.</h1>
        <p className="mt-3 text-muted text-sm">{reports.length} open</p>

        <ul className="mt-10 space-y-4">
          {reports.length === 0 && (
            <li className="text-muted serif italic text-lg">Inbox zero.</li>
          )}
          {reports.map((r) => <ReportRow key={r.id} report={r as any} />)}
        </ul>
      </div>
    </AppShell>
  );
}
