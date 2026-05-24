import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({ kind: z.enum(["fire", "real", "samesame"]) });

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { data: existing } = await admin
    .from("ConfessionReaction")
    .select("id")
    .eq("confessionId", params.id)
    .eq("userId", me.id)
    .eq("kind", parsed.data.kind)
    .maybeSingle();

  if (existing) {
    await admin.from("ConfessionReaction").delete().eq("id", (existing as any).id);
  } else {
    await admin.from("ConfessionReaction").insert({
      id: cuid(),
      confessionId: params.id,
      userId: me.id,
      kind: parsed.data.kind,
      createdAt: new Date().toISOString()
    });
  }

  const { data: all } = await admin
    .from("ConfessionReaction")
    .select("kind")
    .eq("confessionId", params.id);

  const counts: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of (all ?? []) as any[]) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  return NextResponse.json({ counts });
}
