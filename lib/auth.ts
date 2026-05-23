import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { isAllowedEmail } from "./auth-domain";
import { randomQrCode } from "./qr";
import { getConfigInt } from "./config";

const adapter = PrismaAdapter(db);

const providers: NextAuthOptions["providers"] = [];

// Google OAuth — primary sign-in. Configured if both client id/secret present.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Always ask which Google account — better UX after sign-out.
      authorization: { params: { prompt: "select_account" } }
    })
  );
}

// Email magic links — secondary. Only configured if SMTP env present.
if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
  providers.push(
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
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!isAllowedEmail(identifier)) {
          // Throwing surfaces a generic error code. We map it to the
          // user-facing "this email can't be used to sign up" line.
          throw new Error("EmailSignin");
        }
        const { default: nodemailer } = await import("nodemailer");
        const transport = nodemailer.createTransport(provider.server as any);
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to Hooked.",
          text: `Sign in: ${url}\n\nIf you didn't request this, ignore this email.`,
          html: htmlEmail(url)
        });
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter,
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/login"
  },
  providers,
  callbacks: {
    // Silent domain gate. Applies to both Google and Email flows.
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
      // First sign-in: assign QR code + founding-member status.
      const qrCode = randomQrCode();
      const limit = await getConfigInt("foundingMemberLimit").catch(() => 500);
      const count = await db.user.count();
      await db.user.update({
        where: { id: user.id },
        data: { qrCode, foundingMember: count <= limit }
      });
    }
  }
};

function htmlEmail(url: string) {
  return `<!doctype html><html><body style="font-family:Inter,Helvetica,Arial,sans-serif;background:#fff;color:#1C1B19;padding:32px;">
    <p style="font-size:24px;font-weight:800;letter-spacing:-0.04em;">Sign in to Hooked.</p>
    <p>Use the link below. It expires in 24 hours.</p>
    <p><a href="${url}" style="display:inline-block;background:#1C1B19;color:#fff;padding:12px 20px;text-decoration:none;border-radius:999px;letter-spacing:0.06em;font-size:12px;font-weight:600;">Sign in</a></p>
    <p style="color:#6A6358;font-size:12px;margin-top:32px;">If you didn't request this, you can ignore the message.</p>
  </body></html>`;
}
