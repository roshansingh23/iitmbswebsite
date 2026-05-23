import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/_diag — visit in browser. Reports which env vars are set (boolean
// only, never values), whether the DB is reachable, and which sign-in
// providers will register. No secrets are returned.
export async function GET() {
  const env = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    EMAIL_SERVER_HOST: !!process.env.EMAIL_SERVER_HOST,
    EMAIL_FROM: !!process.env.EMAIL_FROM,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ALLOWED_EMAIL_DOMAINS: !!process.env.ALLOWED_EMAIL_DOMAINS
  };

  const providers: string[] = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push("google");
  if (env.EMAIL_SERVER_HOST && env.EMAIL_FROM) providers.push("email");

  let db_reachable = false;
  let user_count: number | null = null;
  let db_error: string | null = null;
  try {
    user_count = await db.user.count();
    db_reachable = true;
  } catch (e: any) {
    db_error = String(e?.message ?? e).slice(0, 200);
  }

  const issues: string[] = [];
  if (!env.NEXTAUTH_URL) issues.push("Set NEXTAUTH_URL on Vercel.");
  if (!env.NEXTAUTH_SECRET) issues.push("Set NEXTAUTH_SECRET on Vercel.");
  if (!env.DATABASE_URL) issues.push("Set DATABASE_URL on Vercel.");
  if (!db_reachable) issues.push("DB not reachable. Check DATABASE_URL password.");
  if (providers.length === 0) issues.push("No sign-in provider configured. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.");

  return NextResponse.json({
    env,
    providers,
    db_reachable,
    user_count,
    db_error,
    issues,
    ok: issues.length === 0
  });
}
