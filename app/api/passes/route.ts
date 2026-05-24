import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ toUserId: z.string().min(1) });

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
  if (parsed.data.toUserId === me.id) {
    return NextResponse.json({ error: "Can't pass on yourself." }, { status: 400 });
  }

  const rl = await checkRateLimit("pass", me.id);
  if (!rl.ok) return NextResponse.json({ error: rl.reason }, { status: 429 });

  await admin.from("Pass").upsert(
    {
      id: cuid(),
      fromUserId: me.id,
      toUserId: parsed.data.toUserId,
      createdAt: new Date().toISOString()
    },
    { onConflict: "fromUserId,toUserId" }
  );

  return NextResponse.json({ ok: true });
}
