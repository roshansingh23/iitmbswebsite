import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Cookies-aware Supabase client for server components, route handlers, and
// server actions. Reads + refreshes the auth session through the same cookie
// jar Next.js uses for the request.
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component; mutations not allowed. Safe to ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        }
      }
    }
  );
}

// Broadcast helper for chat / realtime. No cookie awareness needed.
let _broadcaster: ReturnType<typeof createClient> | null = null;
export async function supabaseBroadcast(channelName: string, event: string, payload: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  if (!_broadcaster) _broadcaster = createClient(url, key, { auth: { persistSession: false } });
  const channel = _broadcaster.channel(channelName);
  await channel.subscribe();
  await channel.send({ type: "broadcast", event, payload });
  setTimeout(() => channel.unsubscribe(), 500);
}
