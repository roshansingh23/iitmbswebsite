import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({ body: z.string().min(1).max(300) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await db.confessionReply.create({
    data: { confessionId: params.id, authorId: me.id, body: parsed.data.body }
  });
  return NextResponse.json({ ok: true });
}
