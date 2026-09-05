import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { timingSafeEqual } from "crypto";
import { isAllowedEmail } from "./auth-domain";

// Demo sign-in. A stop-gap while the Google client secret is missing on
// Vercel: set DEMO_LOGIN_PASSWORD and the login screen grows a second,
// password-gated way in. Leave the env var unset and the provider is not
// registered at all — there is no demo door in production by default.
export const DEMO_PROVIDER_ID = "demo";
const DEMO_EMAIL = (process.env.DEMO_LOGIN_EMAIL ?? "demo@example.edu").trim().toLowerCase();

export function demoLoginEnabled(): boolean {
  return (process.env.DEMO_LOGIN_PASSWORD ?? "").trim().length > 0;
}

// Constant-time compare so the password can't be recovered by timing the
// endpoint. Length is compared first because timingSafeEqual throws on a
// length mismatch.
function demoPasswordMatches(given: string): boolean {
  const expected = (process.env.DEMO_LOGIN_PASSWORD ?? "").trim();
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Auth.js (NextAuth v4) configuration. The OAuth handshake now runs on our
// own domain (/api/auth/...), not on supabase.co. Google client id/secret
// live in Vercel env. Sessions are stateless JWTs signed with NEXTAUTH_SECRET
// — no database adapter, so Supabase is used purely as the data store via the
// service-role key in lib/session.ts.
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    // Registered only while DEMO_LOGIN_PASSWORD is set.
    ...(demoLoginEnabled()
      ? [
          CredentialsProvider({
            id: DEMO_PROVIDER_ID,
            name: "Demo",
            credentials: {
              password: { label: "Demo password", type: "password" }
            },
            async authorize(credentials) {
              if (!demoLoginEnabled()) return null;
              if (!demoPasswordMatches(credentials?.password ?? "")) return null;
              return { id: "demo", email: DEMO_EMAIL, name: "Demo account" };
            }
          })
        ]
      : [])
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // Send rejected / failed sign-ins back to our own login screen with an
  // ?error= param the form already knows how to display.
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Silent email gate. Returning false makes NextAuth redirect to
    // /login?error=AccessDenied, which the login form renders as
    // "That email can't be used to sign in." The demo account is exempt — it
    // already proved itself with the shared password.
    async signIn({ user, account }) {
      if (account?.provider === DEMO_PROVIDER_ID) return demoLoginEnabled();
      return isAllowedEmail(user?.email ?? "");
    },
    async jwt({ token, account }) {
      // token.sub = Google account id, token.email / token.name from Google.
      // Mark demo sessions so the profile row they touch can be kept out of
      // everyone else's discover feed.
      if (account?.provider === DEMO_PROVIDER_ID) (token as any).demo = true;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).sub = token.sub ?? null;
        (session.user as any).demo = (token as any).demo === true;
      }
      return session;
    }
  }
};
