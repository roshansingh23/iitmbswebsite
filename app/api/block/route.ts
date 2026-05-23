import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({ toUserId: z.string().min(1) });

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (parsed.data.toUserId === me.id) return NextResponse.json({ error: "Can't block yourself." }, { status: 400 });

  await db.$transaction([
    db.block.upsert({
      where: { fromUserId_toUserId: { fromUserId: me.id, toUserId: parsed.data.toUserId } },
      create: { fromUserId: me.id, toUserId: parsed.data.toUserId },
      update: {}
    }),
    db.hook.deleteMany({
      where: {
        OR: [
          { fromUserId: me.id, toUserId: parsed.data.toUserId },
          { fromUserId: parsed.data.toUserId, toUserId: me.id }
        ]
      }
    })
  ]);
  return NextResponse.json({ ok: true });
}
