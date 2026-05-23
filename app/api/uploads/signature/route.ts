import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const sig = signUpload({});
    return NextResponse.json(sig);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Cloudinary not configured" }, { status: 503 });
  }
}
