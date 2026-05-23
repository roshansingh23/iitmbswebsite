"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReportRow({ report }: { report: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const summary = report.targetMessage?.body ?? report.targetConfession?.body ?? report.targetReply?.body ?? report.targetUser?.name ?? "—";

  async function act(action: "dismiss" | "action") {
    setBusy(action);
    await fetch(`/api/admin/reports/${report.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <li className="card-line p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-[0.18em]">{report.targetType}</p>
          <p className="mt-1 serif italic">"{summary}"</p>
        </div>
        <p className="text-xs text-muted">
          reported by {report.reporter.name ?? report.reporter.email}
        </p>
      </div>
      <p className="mt-4 text-sm">{report.reason}</p>
      <div className="mt-5 pt-4 border-t border-hairline flex items-center justify-end gap-3">
        <Button variant="line" onClick={() => act("dismiss")} disabled={busy !== null}>
          {busy === "dismiss" ? "…" : "Dismiss"}
        </Button>
        <Button onClick={() => act("action")} disabled={busy !== null}>
          {busy === "action" ? "…" : "Take action"}
        </Button>
      </div>
    </li>
  );
}
