"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      // Generic — never leak which emails do or don't qualify.
      setMessage("This email can't be used to sign up. Try a different address.");
      return;
    }
    setStatus("sent");
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-10 space-y-6">
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
      {(status === "error" || errorParam) && (
        <p className="mt-6 text-sm text-ink border-l border-ink pl-3">
          {message || "Something went wrong. Try again."}
        </p>
      )}
    </>
  );
}
