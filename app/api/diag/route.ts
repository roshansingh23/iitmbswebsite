import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, demoLoginEnabled } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    ALLOWED_EMAIL_DOMAINS: !!process.env.ALLOWED_EMAIL_DOMAINS,
    DEMO_LOGIN: demoLoginEnabled()
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

  // Auth.js session check.
  let session_email: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    session_email = session?.user?.email ?? null;
  } catch {}

  const issues: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL) issues.push("Set NEXT_PUBLIC_SUPABASE_URL on Vercel.");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push("Set SUPABASE_SERVICE_ROLE_KEY on Vercel — DB access path.");
  } else if (!db_reachable) {
    issues.push(`DB unreachable through service_role: ${db_error}`);
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) issues.push("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel.");
  if (env.DEMO_LOGIN) issues.push("Demo login is ON (DEMO_LOGIN_PASSWORD set) — unset it once Google sign-in works.");
  if (!env.NEXTAUTH_SECRET) issues.push("Set NEXTAUTH_SECRET on Vercel (openssl rand -base64 32).");
  if (!env.NEXTAUTH_URL) issues.push("Set NEXTAUTH_URL to your custom domain (https://...).");

  return NextResponse.json({
    env,
    db_reachable,
    user_count,
    db_error,
    session_email,
    issues,
    ok: db_reachable && env.SUPABASE_SERVICE_ROLE_KEY && env.GOOGLE_CLIENT_ID && env.NEXTAUTH_SECRET
  });
}
