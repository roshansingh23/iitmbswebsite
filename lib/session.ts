import { supabaseServer } from "./supabase-server";
import { db } from "./db";
import { randomQrCode } from "./qr";
import { getConfigInt } from "./config";

// Returns the joined "domain" user — the Supabase auth identity plus our own
// profile row. On first sign-in there's no profile row yet, so we create a
// minimal one keyed to the Supabase auth id.
export async function getSessionUser() {
  const supabase = supabaseServer();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) return null;

  let profile = await db.user.findUnique({
    where: { authId: authUser.id },
    include: {
      photos: { orderBy: { position: "asc" } },
      userPrompts: { include: { prompt: true } }
    }
  });

  if (!profile) {
    // Best-effort first-touch profile creation. Wrapped in try/catch because
    // the row might already exist via a race with another tab.
    try {
      const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (meta.full_name as string | undefined) ??
        (meta.name as string | undefined) ??
        null;
      const limit = await getConfigInt("foundingMemberLimit").catch(() => 500);
      const count = await db.user.count();
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
      profile = await db.user.findUnique({
        where: { authId: authUser.id },
        include: {
          photos: { orderBy: { position: "asc" } },
          userPrompts: { include: { prompt: true } }
        }
      });
    }
  }

  return profile;
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
