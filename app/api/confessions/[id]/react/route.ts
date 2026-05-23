import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({ kind: z.enum(["fire", "real", "samesame"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const existing = await db.confessionReaction.findUnique({
    where: { confessionId_userId_kind: { confessionId: params.id, userId: me.id, kind: parsed.data.kind } }
  });

  if (existing) {
    await db.confessionReaction.delete({ where: { id: existing.id } });
  } else {
    await db.confessionReaction.create({
      data: { confessionId: params.id, userId: me.id, kind: parsed.data.kind }
    });
  }

  const all = await db.confessionReaction.findMany({ where: { confessionId: params.id } });
  const counts: Record<string, number> = { fire: 0, real: 0, samesame: 0 };
  for (const r of all) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  return NextResponse.json({ counts });
}
