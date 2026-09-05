import { supabaseAdmin } from "@/lib/supabase-server";
import { renderQrPng } from "@/lib/qr";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = supabaseAdmin();
  if (!admin) return new Response("Not configured", { status: 503 });

  const { data: user } = await admin
    .from("User")
    .select("qrCode")
    .eq("qrCode", params.id)
    .maybeSingle();

  if (!user) return new Response("Not found", { status: 404 });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${site}/u/${(user as any).qrCode}`;
  const png = await renderQrPng(url);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
