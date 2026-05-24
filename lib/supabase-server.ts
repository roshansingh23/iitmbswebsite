import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cookie-aware client for the signed-in user's context. Uses the anon key
// and respects RLS — never use this for elevated writes.
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component context — mutations not allowed. Safe to swallow;
            // middleware refreshes the session on the next request.
          }
        }
      }
    }
  );
}

// Service-role client. Bypasses RLS. Uses Supabase's JWT auth — no Postgres
// password required. Lives ONLY on the server (never imported by client code).
let _admin: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _admin;
}

// Realtime broadcast for chat. Uses the HTTP broadcast endpoint instead
// of a WebSocket so server-side route handlers don't race with channel
// subscription. The previous WebSocket version called channel.send()
// before SUBSCRIBED fired, dropping most messages silently.
export async function supabaseBroadcast(channelName: string, event: string, payload: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          {
            topic: channelName,
            event,
            payload,
            private: false
          }
        ]
      })
    });
  } catch (e) {
    console.error("broadcast failed:", e);
  }
}
