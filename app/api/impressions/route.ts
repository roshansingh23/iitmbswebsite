import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1).max(30)
});

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

// Records that the signed-in user saw these candidates in the deck right
// now. The discover query then hard-excludes any candidate seen within the
// last 24h so reloads don't keep showing the same faces.
export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const now = new Date().toISOString();
  const rows = parsed.data.candidateIds
    .filter((id) => id !== me.id)
    .map((candidateId) => ({
      id: cuid(),
      viewerId: me.id,
      candidateId,
      lastShownAt: now
    }));
  if (rows.length === 0) return NextResponse.json({ ok: true });

  // onConflict bump: if a row already exists for (viewer, candidate),
  // just refresh lastShownAt — keeps the table bounded by the candidate
  // pool size, not by impression count.
  const { error } = await admin
    .from("Impression")
    .upsert(rows, { onConflict: "viewerId,candidateId" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
