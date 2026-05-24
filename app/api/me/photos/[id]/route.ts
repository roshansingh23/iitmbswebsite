import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireUser().catch(() => null);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ error: "server misconfigured" }, { status: 503 });

  // Ownership check enforced via the userId equality — a user can only delete
  // their own photos. The Cloudinary asset is left in the CDN; we don't
  // cascade-destroy here to keep the request fast and idempotent. Orphans
  // can be swept by a periodic cleanup job.
  const { error } = await admin
    .from("Photo")
    .delete()
    .eq("id", params.id)
    .eq("userId", me.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
