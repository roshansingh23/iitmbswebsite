import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ALLOWED_EMAIL_DOMAINS: !!process.env.ALLOWED_EMAIL_DOMAINS
  };

  // Admin DB connectivity test — uses the service_role JWT, no password.
  let db_reachable = false;
  let user_count: number | null = null;
  let db_error: string | null = null;
  const admin = supabaseAdmin();
  if (admin) {
    try {
      const { count, error } = await admin.from("User").select("id", { count: "exact", head: true });
      if (error) throw error;
      user_count = count ?? 0;
      db_reachable = true;
    } catch (e: any) {
      db_error = String(e?.message ?? e).slice(0, 250);
    }
  }

  // Auth (cookie session) check.
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
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push("Set SUPABASE_SERVICE_ROLE_KEY on Vercel — this is the new DB access path (no Postgres password needed).");
  } else if (!db_reachable) {
    issues.push(`DB unreachable through service_role: ${db_error}`);
  }

  const auth_ok = !!supabase_session?.email;

  return NextResponse.json({
    env,
    auth_ok,
    db_reachable,
    user_count,
    db_error,
    supabase_session,
    supabase_error,
    issues,
    ok: db_reachable && env.SUPABASE_SERVICE_ROLE_KEY && auth_ok
  });
}
