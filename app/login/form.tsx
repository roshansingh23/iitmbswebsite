"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Map of NextAuth error codes to user-facing messages. Specific enough to
// actually debug a misconfiguration, but never leaks who is/isn't allowed.
const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in isn't configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, and DATABASE_URL in your environment, then redeploy.",
  AccessDenied:
    "This email can't be used to sign up.",
  Verification:
    "That link expired. Request a new one.",
  OAuthSignin:
    "Couldn't start Google sign-in. Confirm GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your environment.",
  OAuthCallback:
    "Google sign-in failed at the callback. Check the Authorised redirect URI in your Google Cloud Console matches: /api/auth/callback/google on this domain.",
  OAuthCreateAccount:
    "Couldn't create your account. Check that DATABASE_URL points to a running Postgres and the schema is applied.",
  EmailCreateAccount:
    "Couldn't create your account. Check that DATABASE_URL points to a running Postgres.",
  Callback:
    "Sign-in failed during the callback step. Try again.",
  OAuthAccountNotLinked:
    "This Google account is linked to a different sign-in method. Use the original one.",
  EmailSignin:
    "This email can't be used to sign up.",
  CredentialsSignin: "Sign-in failed.",
  SessionRequired: "Please sign in to continue.",
  Default: "Something went wrong. Try again."
};

export function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get("error");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const res = await signIn("email", { email, redirect: false, callbackUrl: "/discover" });
    if (res?.error) {
      setStatus("error");
      setMessage(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.Default);
      return;
    }
    setStatus("sent");
  }

  const inlineError = errorParam ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/discover" })}
        className="mt-10 w-full inline-flex items-center justify-center gap-3 border border-ink rounded-full px-5 py-3 text-sm font-semibold hover:bg-tint transition"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-8 flex items-center gap-4">
        <span className="flex-1 h-px bg-hairline" />
        <span className="text-[0.65rem] tracking-[0.22em] uppercase text-muted font-semibold">Or by email</span>
        <span className="flex-1 h-px bg-hairline" />
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </Button>
      </form>

      {status === "sent" && (
        <p className="mt-6 text-sm text-muted border-l border-ink pl-3">
          Check your inbox. The link expires in 24 hours.
        </p>
      )}
      {(status === "error" || inlineError) && (
        <p className="mt-6 text-sm text-ink border-l border-ink pl-3 leading-relaxed">
          {message || inlineError}
        </p>
      )}
    </>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="currentColor" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="currentColor" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" opacity=".65" />
      <path fill="currentColor" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" opacity=".4" />
      <path fill="currentColor" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" opacity=".8" />
    </svg>
  );
}
