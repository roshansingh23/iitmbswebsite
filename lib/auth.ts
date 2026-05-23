import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { isAllowedEmail, GENERIC_REJECT_MESSAGE } from "./auth-domain";
import { randomQrCode } from "./qr";
import { getConfigInt } from "./config";

const adapter = PrismaAdapter(db);

export const authOptions: NextAuthOptions = {
  adapter,
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login" // surface errors back to login as ?error=...
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      // The gate fires before the magic link is sent. Generic throw.
      async sendVerificationRequest({ identifier, url, provider, theme }) {
        if (!isAllowedEmail(identifier)) {
          // Throwing here is what NextAuth surfaces as the error code. We map
          // it back to a generic message on the login page.
          throw new Error("EmailSignin");
        }
        // Delegate to the default sender — keeps SMTP wiring simple.
        const { default: nodemailer } = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server as any);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in",
          text: `Sign in: ${url}\n\nIf you didn't request this, ignore this email.`,
          html: htmlEmail(url)
        });
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      return isAllowedEmail(user.email);
    },
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id;
        const u = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true, accessTier: true, foundingMember: true, verified: true,
            paused: true, isAdmin: true, name: true, age: true, gender: true,
            orientation: true, showMe: true, qrCode: true
          }
        });
        Object.assign(session.user as any, u ?? {});
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      // First sign-in: assign a QR code and check founding-member window.
      const qrCode = randomQrCode();
      const limit = await getConfigInt("foundingMemberLimit").catch(() => 500);
      const count = await db.user.count();
      await db.user.update({
        where: { id: user.id },
        data: {
          qrCode,
          foundingMember: count <= limit
        }
      });
    }
  }
};

function htmlEmail(url: string) {
  // Plain, literal — no slang in functional copy.
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#F3F0E9;color:#1C1B19;padding:32px;">
    <p style="font-size:24px;letter-spacing:-0.02em;">Welcome back.</p>
    <p>Use the link below to sign in. It will expire in 24 hours.</p>
    <p><a href="${url}" style="display:inline-block;background:#1C1B19;color:#F3F0E9;padding:12px 20px;text-decoration:none;border-radius:999px;letter-spacing:0.18em;font-size:12px;text-transform:uppercase;">Sign in</a></p>
    <p style="color:#6A6358;font-size:12px;margin-top:32px;">If you didn't request this, you can ignore the message.</p>
  </body></html>`;
}
