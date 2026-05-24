import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    ALLOWED_EMAIL_DOMAINS: !!process.env.ALLOWED_EMAIL_DOMAINS
  };

  let db_reachable = false;
  let user_count: number | null = null;
  let db_error: string | null = null;
  try {
    user_count = await db.user.count();
    db_reachable = true;
  } catch (e: any) {
    db_error = String(e?.message ?? e).slice(0, 200);
  }

  let supabase_session: null | { email: string | null } = null;
  let supabase_error: string | null = null;
  try {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) supabase_session = { email: user.email ?? null };
  } catch (e: any) {
    supabase_error = String(e?.message ?? e).slice(0, 200);
  }

  const issues: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL) issues.push("Set NEXT_PUBLIC_SUPABASE_URL on Vercel.");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) issues.push("Set NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel.");
  if (!env.DATABASE_URL) issues.push("Set DATABASE_URL on Vercel.");
  if (!db_reachable) issues.push("DB not reachable. Check DATABASE_URL password.");
  issues.push(
    "Enable Google in Supabase Dashboard → Authentication → Providers → Google (paste Client ID + Secret)."
  );
  issues.push(
    "Add the Supabase callback URL to Google Cloud Console: https://xwrbyfikhcyxlehffcjm.supabase.co/auth/v1/callback"
  );

  return NextResponse.json({
    env,
    db_reachable,
    user_count,
    db_error,
    supabase_session,
    supabase_error,
    issues,
    ok: db_reachable && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.DATABASE_URL
  });
}
