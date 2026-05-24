// Server-side push sender. Fails open if VAPID env vars aren't set so
// the app keeps working even before push has been configured in Vercel.
import webpush from "web-push";
import { supabaseAdmin } from "./supabase-server";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT ?? "mailto:noreply@mismatched.app";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;
  const admin = supabaseAdmin();
  if (!admin) return;

  const { data: subs } = await admin
    .from("PushSubscription")
    .select("id,endpoint,p256dh,auth")
    .eq("userId", userId);
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.allSettled(
    (subs as any[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth }
          },
          body
        );
      } catch (e: any) {
        // 404/410 means the browser has dropped the subscription —
        // clean it up so we don't keep trying.
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await admin.from("PushSubscription").delete().eq("id", s.id);
        } else {
          console.error("web push send failed:", e?.statusCode, e?.body ?? e?.message);
        }
      }
    })
  );
}
