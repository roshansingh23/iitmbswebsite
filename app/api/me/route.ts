import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sanitizeDisplayName } from "@/lib/anon-name";
import { sanitizeInterests } from "@/lib/interests";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  // The anonymous handle. Validated by sanitizeDisplayName below, not here,
  // so the member gets a message that says what to fix. null clears it and
  // puts them back on a generated alias.
  displayName: z.string().nullable().optional(),
  // Soft pairing tags. Unknown slugs are dropped, not rejected.
  interests: z.array(z.string()).optional(),
  // Stated random-chat preferences. Stored now, not yet read by the
  // matchmaker.
  randomPrefGender: z.enum(["anyone", "women", "men"]).optional(),
  randomPrefWorkspace: z.enum(["same", "different", "any"]).optional(),
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

  const patch: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.interests !== undefined) {
    patch.interests = sanitizeInterests(parsed.data.interests);
  }

  if (parsed.data.displayName !== undefined) {
    if (parsed.data.displayName === null) {
      patch.displayName = null;
    } else {
      const check = sanitizeDisplayName(parsed.data.displayName);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      patch.displayName = check.value;
    }
  }

  const { error } = await admin
    .from("User")
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq("id", me.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
