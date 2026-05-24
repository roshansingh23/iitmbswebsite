import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1)
});

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
}

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  // Hard cap at 5 photos per user. UI also enforces this but server is
  // the source of truth.
  const { count } = await admin
    .from("Photo")
    .select("id", { count: "exact", head: true })
    .eq("userId", me.id);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Max 5 photos. Remove one first." }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("Photo")
    .select("position")
    .eq("userId", me.id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = existing && existing.length > 0 ? (existing[0].position ?? 0) + 1 : 0;

  const { data, error } = await admin
    .from("Photo")
    .insert({
      id: cuid(),
      userId: me.id,
      url: parsed.data.url,
      publicId: parsed.data.publicId,
      position: nextPos,
      createdAt: new Date().toISOString()
    })
    .select("id,url,publicId,position")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photo: data });
}
