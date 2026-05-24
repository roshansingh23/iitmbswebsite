import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(60),
  age: z.number().int().min(18).max(99).nullable(),
  bio: z.string().max(500).optional().default(""),
  gender: z.enum(["man", "woman", "nonbinary", "other"]).nullable(),
  orientation: z.enum(["straight", "gay", "lesbian", "bisexual", "pansexual", "asexual", "other"]).nullable(),
  showMe: z.array(z.enum(["man", "woman", "nonbinary", "other"])),
  photos: z.array(z.object({ url: z.string().url(), publicId: z.string() })).max(20),
  answers: z.array(z.object({ promptId: z.string(), answer: z.string().min(1).max(280) })).max(6)
});

function cuid(prefix = "c") {
  return prefix + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Server not configured (SUPABASE_SERVICE_ROLE_KEY missing)." },
      { status: 503 }
    );
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, age, bio, gender, orientation, showMe, photos, answers } = parsed.data;

  // 1) Update profile basics.
  const { error: updateErr } = await admin
    .from("User")
    .update({
      name,
      age,
      bio,
      gender,
      orientation,
      showMe
    })
    .eq("id", user.id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 2) Photos — replace.
  await admin.from("Photo").delete().eq("userId", user.id);
  if (photos.length > 0) {
    const rows = photos.map((p, i) => ({
      id: cuid(),
      userId: user.id,
      url: p.url,
      publicId: p.publicId,
      position: i,
      createdAt: new Date().toISOString()
    }));
    const { error: photoErr } = await admin.from("Photo").insert(rows);
    if (photoErr) return NextResponse.json({ error: photoErr.message }, { status: 500 });
  }

  // 3) Prompt answers — dedupe + replace.
  await admin.from("UserPrompt").delete().eq("userId", user.id);
  const dedup = new Map<string, string>();
  answers.forEach((a) => {
    if (a.promptId && !dedup.has(a.promptId)) dedup.set(a.promptId, a.answer);
  });
  if (dedup.size > 0) {
    let i = 0;
    const rows = Array.from(dedup, ([promptId, answer]) => ({
      id: cuid(),
      userId: user.id,
      promptId,
      answer,
      position: i++,
      createdAt: new Date().toISOString()
    }));
    const { error: upErr } = await admin.from("UserPrompt").insert(rows);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
