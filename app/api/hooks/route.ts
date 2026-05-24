import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  toUserId: z.string().min(1),
  targetType: z.enum(["photo", "prompt", "profile"]),
  targetId: z.string().nullable(),
  note: z.string().max(200).nullable(),
  isHardHook: z.boolean().default(false)
});

function cuid(prefix = "c") {
  return prefix + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { toUserId, targetType, targetId, note, isHardHook } = parsed.data;

  if (toUserId === me.id) {
    return NextResponse.json({ error: "Can't hook yourself." }, { status: 400 });
  }

  if (isHardHook && me.accessTier === "free") {
    return NextResponse.json({ error: "Hard hooks need Plus." }, { status: 402 });
  }

  // Block check both directions.
  const { data: blocked } = await admin
    .from("Block")
    .select("id")
    .or(`and(fromUserId.eq.${me.id},toUserId.eq.${toUserId}),and(fromUserId.eq.${toUserId},toUserId.eq.${me.id})`)
    .limit(1)
    .maybeSingle();
  if (blocked) {
    return NextResponse.json({ error: "Can't reach this person." }, { status: 403 });
  }

  // Resolve photo / prompt target id by ownership.
  let photoId: string | null = null;
  let userPromptId: string | null = null;
  if (targetType === "photo" && targetId) {
    const { data } = await admin.from("Photo").select("id").eq("id", targetId).eq("userId", toUserId).maybeSingle();
    if (!data) return NextResponse.json({ error: "Target not found." }, { status: 404 });
    photoId = data.id;
  }
  if (targetType === "prompt" && targetId) {
    const { data } = await admin.from("UserPrompt").select("id").eq("id", targetId).eq("userId", toUserId).maybeSingle();
    if (!data) return NextResponse.json({ error: "Target not found." }, { status: 404 });
    userPromptId = data.id;
  }

  // Upsert the hook (unique on fromUserId + toUserId).
  const existingRes = await admin
    .from("Hook")
    .select("id")
    .eq("fromUserId", me.id)
    .eq("toUserId", toUserId)
    .maybeSingle();

  if (existingRes.data?.id) {
    await admin
      .from("Hook")
      .update({ targetType, photoId, userPromptId, note, isHardHook })
      .eq("id", existingRes.data.id);
  } else {
    const { error: insErr } = await admin.from("Hook").insert({
      id: cuid(),
      fromUserId: me.id,
      toUserId,
      targetType,
      photoId,
      userPromptId,
      note,
      isHardHook,
      seen: false,
      createdAt: new Date().toISOString()
    });
    if (insErr) {
      console.error("Hook insert failed:", insErr.message);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  // Mutual hook check — if they already hooked me, create Match + Conversation.
  const { data: reverse } = await admin
    .from("Hook")
    .select("id")
    .eq("fromUserId", toUserId)
    .eq("toUserId", me.id)
    .maybeSingle();

  if (reverse) {
    const [a, b] = [me.id, toUserId].sort();
    const now = new Date().toISOString();
    const { data: existingMatch } = await admin
      .from("Match")
      .select("id")
      .eq("userAId", a)
      .eq("userBId", b)
      .maybeSingle();
    const matchId = existingMatch?.id ?? cuid();
    if (!existingMatch) {
      await admin.from("Match").insert({ id: matchId, userAId: a, userBId: b, createdAt: now });
    }
    const { data: existingConv } = await admin
      .from("Conversation")
      .select("id")
      .eq("matchId", matchId)
      .maybeSingle();
    if (!existingConv) {
      await admin.from("Conversation").insert({
        id: cuid(),
        matchId,
        userAId: a,
        userBId: b,
        interactionSeconds: 0,
        capSeconds: 900,
        locked: false,
        createdAt: now,
        updatedAt: now
      });
    }
    const { data: conv } = await admin.from("Conversation").select("id").eq("matchId", matchId).maybeSingle();
    return NextResponse.json({ ok: true, matched: conv?.id });
  }

  return NextResponse.json({ ok: true });
}
