import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { isAllowedEmail } from "@/lib/auth-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase OAuth lands the user here with a `code` query param. We:
//   1. Exchange the code for a session (this writes auth cookies)
//   2. Enforce the silent domain gate
//   3. Redirect to the originally-requested route
// All failures fall through to /login with an error code — never a 500.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/discover";

  // Vercel proxies the request internally; the user-facing host comes in via
  // x-forwarded-host. Use that for the final redirect target.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isProd = process.env.NODE_ENV === "production";
  function target(path: string) {
    return forwardedHost && isProd
      ? `https://${forwardedHost}${path}`
      : `${origin}${path}`;
  }

  if (!code) {
    return NextResponse.redirect(target("/login?error=callback_failed"));
  }

  try {
    const supabase = supabaseServer();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      console.error("exchangeCodeForSession failed:", error?.message ?? "no user");
      return NextResponse.redirect(target("/login?error=callback_failed"));
    }

    if (!isAllowedEmail(data.user.email)) {
      await supabase.auth.signOut().catch(() => {});
      return NextResponse.redirect(target("/login?error=AccessDenied"));
    }

    return NextResponse.redirect(target(next));
  } catch (e: any) {
    console.error("Auth callback exception:", e?.message ?? e);
    return NextResponse.redirect(target("/login?error=callback_failed"));
  }
}
