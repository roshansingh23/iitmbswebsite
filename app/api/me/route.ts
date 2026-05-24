import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  age: z.number().int().min(18).max(99).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  height: z.string().max(30).nullable().optional(),
  location: z.string().max(80).nullable().optional(),
  intentions: z.string().max(60).nullable().optional(),
  relationshipType: z.string().max(60).nullable().optional(),
  filterAgeMin: z.number().int().min(18).max(99).optional(),
  filterAgeMax: z.number().int().min(18).max(99).optional(),
  filterIntentions: z.string().max(60).nullable().optional(),
  filterActiveToday: z.boolean().optional(),
  filterNewHere: z.boolean().optional()
});

export async function PATCH(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.filterAgeMin && parsed.data.filterAgeMax && parsed.data.filterAgeMin > parsed.data.filterAgeMax) {
    return NextResponse.json({ error: "min age can't exceed max age" }, { status: 400 });
  }

  const { error } = await admin
    .from("User")
    .update({ ...parsed.data, updatedAt: new Date().toISOString() })
    .eq("id", me.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
