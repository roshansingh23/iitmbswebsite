// Server-side Supabase Realtime broadcast helper. Uses the public anon key
// because broadcast channels with `private: false` accept anon publishes.
// Falls through silently if Supabase env vars aren't configured (dev / build).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
function client() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export async function supabaseBroadcast(channelName: string, event: string, payload: unknown) {
  const sb = client();
  if (!sb) return;
  const channel = sb.channel(channelName);
  await channel.subscribe();
  await channel.send({ type: "broadcast", event, payload });
  setTimeout(() => { channel.unsubscribe(); }, 500);
}
