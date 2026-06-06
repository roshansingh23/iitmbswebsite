import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAllowedEmail } from "./auth-domain";

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
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // Send rejected / failed sign-ins back to our own login screen with an
  // ?error= param the form already knows how to display.
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // Silent IITM-domain gate. Returning false makes NextAuth redirect to
    // /login?error=AccessDenied, which the login form renders as
    // "Only IITM student email allowed."
    async signIn({ user }) {
      return isAllowedEmail(user?.email ?? "");
    },
    async jwt({ token }) {
      // token.sub = Google account id, token.email / token.name from Google.
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).sub = token.sub ?? null;
      }
      return session;
    }
  }
};
