export { default } from "next-auth/middleware";

// Anything under these paths requires a signed-in session. Public marketing
// pages, /login, /verify-request, and the static landing remain open.
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
