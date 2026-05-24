import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";

// /u/[qr] resolves a QR token to a profile page.
export default async function QrResolvePage({ params }: { params: { qr: string } }) {
  const admin = supabaseAdmin();
  if (!admin) notFound();

  const { data: user } = await admin
    .from("User")
    .select("id")
    .eq("qrCode", params.qr)
    .maybeSingle();
  if (!user) notFound();
  redirect(`/profile/${(user as any).id}`);
}
