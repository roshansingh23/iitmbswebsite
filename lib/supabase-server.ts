import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Cookie-aware Supabase client for server components, route handlers, and
// server actions. Uses the @supabase/ssr v0.10+ getAll/setAll API so the
// session cookies set during OAuth callback actually persist on the response.
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
            // Server Components can't mutate cookies — ignore silently. The
            // middleware refreshes the session on the next request anyway.
          }
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
