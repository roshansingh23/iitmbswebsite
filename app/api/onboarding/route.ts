import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { Gender, Orientation } from "@prisma/client";

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

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, age, bio, gender, orientation, showMe, photos, answers } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name, age, bio,
        gender: (gender ?? undefined) as Gender | undefined,
        orientation: (orientation ?? undefined) as Orientation | undefined,
        showMe: showMe as Gender[]
      }
    });

    if (photos.length > 0) {
      await tx.photo.deleteMany({ where: { userId: user.id } });
      await tx.photo.createMany({
        data: photos.map((p, i) => ({
          userId: user.id, url: p.url, publicId: p.publicId, position: i
        }))
      });
    }

    if (answers.length > 0) {
      await tx.userPrompt.deleteMany({ where: { userId: user.id } });
      // Filter out empty promptIds defensively.
      const rows = answers.filter((a) => a.promptId).map((a, i) => ({
        userId: user.id, promptId: a.promptId, answer: a.answer, position: i
      }));
      // Skip duplicates (same promptId twice) by reducing.
      const seen = new Set<string>();
      const unique = rows.filter((r) => !seen.has(r.promptId) && (seen.add(r.promptId) || true));
      for (const r of unique) {
        await tx.userPrompt.create({ data: r });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
