import { db } from "@/lib/db";
import { renderQrPng } from "@/lib/qr";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // params.id is the user's qrCode (short random string from createUser event).
  const user = await db.user.findFirst({
    where: { qrCode: params.id },
    select: { qrCode: true }
  });
  if (!user) return new Response("Not found", { status: 404 });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${site}/u/${user.qrCode}`;
  const png = await renderQrPng(url);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable"
    }
  });
}
