// Supabase Edge Function — signs a Cloudinary upload on behalf of the
// signed-in user. The Cloudinary credentials live ONLY in this function's
// secrets store (Supabase Dashboard → Edge Functions → Manage secrets), so
// they never reach Vercel env or the browser.
//
// Deploy: `supabase functions deploy cloudinary-signature`
//   or via Supabase Dashboard → Edge Functions → New function.
//
// Auth: relies on Supabase's built-in JWT verification. Anyone without a
// signed-in session gets a 401 before the function body even runs.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
  const folder = Deno.env.get("CLOUDINARY_UPLOAD_FOLDER") ?? "hooked";

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({
        error:
          "Cloudinary secrets missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in this function's secrets."
      }),
      {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" }
      }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature spec: sort signed params alphabetically, join as
  // key=value pairs with &, append api_secret, hash with SHA-1, hex-encode.
  // We only sign `folder` and `timestamp`; api_key + signature itself are
  // sent unsigned per Cloudinary's protocol.
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
  const signature = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return new Response(
    JSON.stringify({ timestamp, folder, signature, apiKey, cloudName }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
});
