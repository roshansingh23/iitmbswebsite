import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getConfigInt } from "@/lib/config";
import { startOfUtcDay } from "@/lib/time";

export const runtime = "nodejs";

const schema = z.object({
  toUserId: z.string().min(1),
  targetType: z.enum(["photo", "prompt", "profile"]),
  targetId: z.string().nullable(),
  note: z.string().max(200).nullable(),
  isHardHook: z.boolean().default(false)
});

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { toUserId, targetType, targetId, note, isHardHook } = parsed.data;

  if (toUserId === me.id) return NextResponse.json({ error: "Can't hook yourself." }, { status: 400 });

  // Hard hooks require paid tier.
  if (isHardHook && me.accessTier === "free") {
    return NextResponse.json({ error: "Hard hooks need Plus. Upgrade to send one." }, { status: 402 });
  }

  // Daily cap for free tier.
  if (me.accessTier === "free") {
    const cap = await getConfigInt("freeDailyHookLimit");
    const today = startOfUtcDay();
    const used = await db.hook.count({
      where: { fromUserId: me.id, createdAt: { gte: today } }
    });
    if (used >= cap) {
      return NextResponse.json({ error: "You're out of hooks for today. They reset at midnight." }, { status: 429 });
    }
  }

  // Block check — neither side has blocked the other.
  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { fromUserId: me.id, toUserId },
        { fromUserId: toUserId, toUserId: me.id }
      ]
    }
  });
  if (blocked) return NextResponse.json({ error: "Can't reach this person." }, { status: 403 });

  // Resolve and validate target ownership.
  let photoId: string | null = null;
  let userPromptId: string | null = null;
  if (targetType === "photo" && targetId) {
    const p = await db.photo.findFirst({ where: { id: targetId, userId: toUserId } });
    if (!p) return NextResponse.json({ error: "Target not found." }, { status: 404 });
    photoId = p.id;
  }
  if (targetType === "prompt" && targetId) {
    const up = await db.userPrompt.findFirst({ where: { id: targetId, userId: toUserId } });
    if (!up) return NextResponse.json({ error: "Target not found." }, { status: 404 });
    userPromptId = up.id;
  }

  // Create or update the hook. Mutual-hook check after.
  await db.hook.upsert({
    where: { fromUserId_toUserId: { fromUserId: me.id, toUserId } },
    create: {
      fromUserId: me.id, toUserId,
      targetType, photoId, userPromptId,
      note, isHardHook
    },
    update: { targetType, photoId, userPromptId, note, isHardHook }
  });

  // Mutual? Create match + conversation.
  const reverse = await db.hook.findFirst({
    where: { fromUserId: toUserId, toUserId: me.id }
  });

  if (reverse) {
    // Canonical pair order to keep the unique key happy.
    const [a, b] = [me.id, toUserId].sort();
    const match = await db.match.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      create: { userAId: a, userBId: b },
      update: {}
    });

    const freeCap = await getConfigInt("freeChatCapSeconds");
    const conv = await db.conversation.upsert({
      where: { matchId: match.id },
      create: { matchId: match.id, userAId: a, userBId: b, capSeconds: freeCap },
      update: {}
    });
    return NextResponse.json({ ok: true, matched: conv.id });
  }

  return NextResponse.json({ ok: true });
}
