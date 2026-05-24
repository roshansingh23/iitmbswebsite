import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/discover", "/hooks", "/matches", "/chat", "/me",
  "/profile", "/onboarding", "/upgrade", "/confessions", "/admin", "/u"
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No Supabase env? Let the request through; pages will surface the
  // configuration issue themselves.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  // Following the @supabase/ssr v0.10+ pattern: getAll + setAll, and always
  // re-create the response after writing cookies so the new Set-Cookie
  // headers make it into the final response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // Touch getUser so Supabase refreshes the session token if needed; that
  // call writes new cookies via setAll above.
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
