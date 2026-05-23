import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/discover", "/hooks", "/matches", "/chat", "/me",
  "/profile", "/onboarding", "/upgrade", "/confessions", "/admin", "/u"
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No Supabase env? Let the request through; pages will handle "no session"
  // themselves. Keeps preview deployments without env from hard-erroring.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/discover/:path*",
    "/hooks/:path*",
    "/matches/:path*",
    "/chat/:path*",
    "/me/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/upgrade/:path*",
    "/confessions/:path*",
    "/admin/:path*",
    "/u/:path*"
  ]
};
