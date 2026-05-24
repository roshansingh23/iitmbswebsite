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
  let db_error_kind: "missing_env" | "wrong_password" | "wrong_host" | "unknown" | null = null;
  try {
    user_count = await db.user.count();
    db_reachable = true;
  } catch (e: any) {
    const raw = String(e?.message ?? e);
    db_error = raw.slice(0, 250);
    if (/Environment variable not found/i.test(raw)) db_error_kind = "missing_env";
    else if (/Authentication failed|credentials.*not valid|password authentication/i.test(raw)) db_error_kind = "wrong_password";
    else if (/ENOTFOUND|tenant.*not found|getaddrinfo/i.test(raw)) db_error_kind = "wrong_host";
    else db_error_kind = "unknown";
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

  // Only surface real, live issues. No hardcoded reminders for things that
  // live outside this app's env (e.g., Google OAuth is configured inside
  // Supabase Dashboard, not Vercel env).
  const issues: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL) issues.push("Set NEXT_PUBLIC_SUPABASE_URL on Vercel.");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) issues.push("Set NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel.");
  if (!env.DATABASE_URL) issues.push("Set DATABASE_URL on Vercel.");

  if (!db_reachable) {
    switch (db_error_kind) {
      case "wrong_password":
        issues.push("DATABASE_URL password is wrong. URL-encode special characters (@ -> %40 etc.) or reset the DB password in Supabase Settings.");
        break;
      case "wrong_host":
        issues.push("DATABASE_URL host/tenant is wrong. Use db.xwrbyfikhcyxlehffcjm.supabase.co:5432 (direct) or aws-1-ap-southeast-1.pooler.supabase.com:6543 (pooler).");
        break;
      case "missing_env":
        issues.push("DATABASE_URL isn't loaded into the runtime. Redeploy after setting it.");
        break;
      default:
        issues.push("DB unreachable. See db_error.");
    }
  }

  const auth_ok = !!supabase_session?.email;

  return NextResponse.json({
    env,
    auth_ok,
    db_reachable,
    user_count,
    db_error,
    db_error_kind,
    supabase_session,
    supabase_error,
    issues,
    ok: db_reachable && env.DATABASE_URL && auth_ok
  });
}
