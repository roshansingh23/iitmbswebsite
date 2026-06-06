import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/discover", "/hooks", "/matches", "/chat", "/me",
  "/profile", "/onboarding", "/upgrade", "/confessions", "/admin", "/u"
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  // Auth.js (NextAuth) JWT — verified locally from the session cookie, no
  // network call. The OAuth handshake itself runs on our own domain.
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
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
