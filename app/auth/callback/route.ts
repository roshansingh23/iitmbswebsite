import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isAllowedEmail } from "@/lib/auth-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase OAuth lands the user here with a `code` param. We exchange it for
// a session cookie, enforce the silent domain gate, then send them onward.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/discover";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  const supabase = supabaseServer();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  const email = data.user?.email ?? null;
  if (!email || !isAllowedEmail(email)) {
    // Sign them out and surface a generic message.
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=AccessDenied`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
