import { supabaseServer } from "./supabase-server";
import { db } from "./db";
import { randomQrCode } from "./qr";
import { getConfigInt } from "./config";

// Always returns either a user or null. Never throws. Any failure (missing
// env, DB unreachable, Supabase down) ends up as null so the calling page
// can redirect to /login.
export async function getSessionUser() {
  try {
    const supabase = supabaseServer();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser?.email) return null;

    let profile = await db.user
      .findUnique({
        where: { authId: authUser.id },
        include: {
          photos: { orderBy: { position: "asc" } },
          userPrompts: { include: { prompt: true } }
        }
      })
      .catch(() => null);

    if (!profile) {
      try {
        const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
        const name =
          (meta.full_name as string | undefined) ??
          (meta.name as string | undefined) ??
          null;
        const limit = await getConfigInt("foundingMemberLimit").catch(() => 500);
        const count = await db.user.count().catch(() => 0);
        profile = await db.user.create({
          data: {
            authId: authUser.id,
            email: authUser.email,
            name,
            qrCode: randomQrCode(),
            foundingMember: count < limit
          },
          include: {
            photos: { orderBy: { position: "asc" } },
            userPrompts: { include: { prompt: true } }
          }
        });
      } catch {
        // Race or unique-constraint hit — try a re-fetch.
        profile = await db.user
          .findUnique({
            where: { authId: authUser.id },
            include: {
              photos: { orderBy: { position: "asc" } },
              userPrompts: { include: { prompt: true } }
            }
          })
          .catch(() => null);
      }
    }

    return profile;
  } catch (e) {
    console.error("getSessionUser failed:", e);
    return null;
  }
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) {
    const e = new Error("UNAUTHENTICATED");
    (e as any).status = 401;
    throw e;
  }
  return u;
}
