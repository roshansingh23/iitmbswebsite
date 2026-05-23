import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

// /u/[qr] resolves a QR code to a profile page. Scanning instantly opens the
// person's profile.
export default async function QrResolvePage({ params }: { params: { qr: string } }) {
  const user = await db.user.findFirst({ where: { qrCode: params.qr }, select: { id: true } });
  if (!user) notFound();
  redirect(`/profile/${user.id}`);
}
