"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Only IITM student email allowed.",
  callback_failed: "Sign-in failed.",
  Default: "Something went wrong."
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Capture the URL error once into state so we can strip ?error= from
  // the URL immediately — otherwise every reload re-shows it forever.
  const [paramError, setParamError] = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? ERROR_MESSAGES.Default) : null
  );

  useEffect(() => {
    if (!errorParam) return;
    // Clear the query string right away (reload won't re-show), keep the
    // message visible for a few seconds, then hide it.
    router.replace("/login", { scroll: false });
    const t = setTimeout(() => setParamError(null), 5000);
    return () => clearTimeout(t);
  }, [errorParam, router]);

  async function signInWithGoogle() {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/discover`
        }
      });
      if (error) {
        setMessage(error.message);
        setBusy(false);
      }
      // Otherwise the browser is being redirected to Google; nothing else to do.
    } catch (e: any) {
      setMessage(e?.message ?? "Couldn't start sign-in.");
      setBusy(false);
    }
  }

  const error = message || paramError;

  return (
    <>
      {/* Error sits ABOVE the button in a raised white block with black
          text so an invalid / non-IITM email is impossible to miss. */}
      {error && (
        <div
          className="mt-8 rounded-xl bg-white px-4 py-3"
          style={{ boxShadow: "0 6px 22px rgba(0,0,0,0.28)" }}
          role="alert"
        >
          <p className="text-sm font-semibold text-ink">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="mt-7 w-full inline-flex items-center justify-center gap-3 rounded-full px-5 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        style={{ background: "#6D1F4E", boxShadow: "0 6px 22px rgba(109,31,78,0.45)" }}
      >
        <GoogleMark />
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
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
