import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  promptId: z.string().min(1),
  answer: z.string().min(1).max(280)
});

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

// POST /api/me/prompts — append a new prompt answer for the signed-in user.
// Used by the "Add prompt" UI on /me. Onboarding's /api/onboarding still
// does a full replace; this is the additive path.
export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Don't double up on the same prompt.
  const { data: existing } = await admin
    .from("UserPrompt")
    .select("id")
    .eq("userId", me.id)
    .eq("promptId", parsed.data.promptId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Already answered. Edit it instead." }, { status: 409 });
  }

  // Position = current max + 1.
  const { data: top } = await admin
    .from("UserPrompt")
    .select("position")
    .eq("userId", me.id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = top && top.length > 0 ? ((top[0] as any).position ?? 0) + 1 : 0;

  const { data, error } = await admin
    .from("UserPrompt")
    .insert({
      id: cuid(),
      userId: me.id,
      promptId: parsed.data.promptId,
      answer: parsed.data.answer,
      position: nextPos,
      createdAt: new Date().toISOString()
    })
    .select("id,answer,position,prompt:Prompt(text)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompt: data });
}

const delSchema = z.object({ id: z.string().min(1) });
export async function DELETE(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = delSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { error } = await admin.from("UserPrompt").delete().eq("id", parsed.data.id).eq("userId", me.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
