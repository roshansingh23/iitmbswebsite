import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { signUpload } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const sig = signUpload({});
    return NextResponse.json(sig);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Cloudinary not configured" }, { status: 503 });
  }
}
