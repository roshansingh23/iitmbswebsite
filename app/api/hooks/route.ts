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

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

// Unhook — undo a previously sent match request. Body: { toUserId }.
// Also tears down a non-matched Conversation (one-way) if it exists.
const deleteSchema = z.object({ toUserId: z.string().min(1) });

export async function DELETE(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = deleteSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { toUserId } = parsed.data;

  await admin.from("Hook").delete().eq("fromUserId", me.id).eq("toUserId", toUserId);

  // If the other side never hooked us, the Conversation is one-way — drop it.
  const { data: reverse } = await admin
    .from("Hook")
    .select("id")
    .eq("fromUserId", toUserId)
    .eq("toUserId", me.id)
    .maybeSingle();
  if (!reverse) {
    const [a, b] = [me.id, toUserId].sort();
    await admin.from("Conversation").delete().eq("userAId", a).eq("userBId", b);
  }

  return NextResponse.json({ ok: true });
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

  // Block check both ways.
  const { data: blocked } = await admin
    .from("Block")
    .select("id")
    .or(`and(fromUserId.eq.${me.id},toUserId.eq.${toUserId}),and(fromUserId.eq.${toUserId},toUserId.eq.${me.id})`)
    .limit(1)
    .maybeSingle();
  if (blocked) return NextResponse.json({ error: "Can't reach this person." }, { status: 403 });

  // Resolve photo/prompt target ownership.
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

  // Upsert the Hook.
  const { data: existingHook } = await admin
    .from("Hook")
    .select("id")
    .eq("fromUserId", me.id)
    .eq("toUserId", toUserId)
    .maybeSingle();
  if (existingHook?.id) {
    await admin
      .from("Hook")
      .update({ targetType, photoId, userPromptId, note, isHardHook })
      .eq("id", existingHook.id);
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

  // Always create a Conversation between the two users (canonical pair).
  // Both sides see the chat row immediately and can start talking — no
  // mutual hook required.
  const [a, b] = [me.id, toUserId].sort();
  const now = new Date().toISOString();

  const { data: existingConv } = await admin
    .from("Conversation")
    .select("id,matchId")
    .eq("userAId", a)
    .eq("userBId", b)
    .maybeSingle();

  let convId = existingConv?.id;
  if (!existingConv) {
    convId = cuid();
    const { error: convErr } = await admin.from("Conversation").insert({
      id: convId,
      matchId: null,
      userAId: a,
      userBId: b,
      interactionSeconds: 0,
      capSeconds: 900,
      locked: false,
      createdAt: now,
      updatedAt: now
    });
    if (convErr) {
      console.error("Conversation insert failed:", convErr.message);
    }
  }

  // If they already hooked us, link Match + Conversation.
  const { data: reverse } = await admin
    .from("Hook")
    .select("id")
    .eq("fromUserId", toUserId)
    .eq("toUserId", me.id)
    .maybeSingle();
  let matched = false;
  if (reverse) {
    const { data: existingMatch } = await admin
      .from("Match")
      .select("id")
      .eq("userAId", a)
      .eq("userBId", b)
      .maybeSingle();
    let matchId = existingMatch?.id;
    if (!existingMatch) {
      matchId = cuid();
      await admin.from("Match").insert({ id: matchId, userAId: a, userBId: b, createdAt: now });
    }
    if (convId && !existingConv?.matchId) {
      await admin.from("Conversation").update({ matchId, updatedAt: now }).eq("id", convId);
    }
    matched = true;
  }

  return NextResponse.json({ ok: true, conversationId: convId, matched });
}
