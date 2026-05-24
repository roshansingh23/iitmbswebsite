import { supabaseServer, supabaseAdmin } from "./supabase-server";
import { randomQrCode } from "./qr";

export type Profile = {
  id: string;
  authId: string;
  email: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  orientation: string | null;
  showMe: string[];
  height: string | null;
  location: string | null;
  intentions: string | null;
  relationshipType: string | null;
  filterAgeMin: number;
  filterAgeMax: number;
  filterIntentions: string | null;
  filterActiveToday: boolean;
  filterNewHere: boolean;
  accessTier: string;
  verified: boolean;
  foundingMember: boolean;
  paused: boolean;
  qrCode: string | null;
  isAdmin: boolean;
  lastSeenAt: string | null;
};

// Debounce window for the lastSeenAt write — anything within 5 minutes of
// the previous touch is a no-op, so we don't slam the DB on every render.
const LAST_SEEN_DEBOUNCE_MS = 5 * 60 * 1000;

export async function getSessionUser(): Promise<Profile | null> {
  try {
    const supabase = supabaseServer();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) return null;

    const admin = supabaseAdmin();
    if (!admin) {
      console.error("SUPABASE_SERVICE_ROLE_KEY missing — can't read profile.");
      return null;
    }

    const { data: existing } = await admin
      .from("User")
      .select("*")
      .eq("authId", authUser.id)
      .maybeSingle();

    if (existing) {
      await touchLastSeen(admin, existing.id, existing.lastSeenAt);
      return normalize(existing);
    }

    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null;
    const id = "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    const now = new Date().toISOString();
    const { data: created, error } = await admin
      .from("User")
      .insert({
        id,
        authId: authUser.id,
        email: authUser.email,
        name,
        qrCode: randomQrCode(),
        showMe: [],
        accessTier: "free",
        filterAgeMin: 18,
        filterAgeMax: 99,
        lastSeenAt: now,
        updatedAt: now
      })
      .select("*")
      .single();

    if (error) {
      console.error("First-touch User insert failed:", error.message);
      const { data: refetched } = await admin
        .from("User")
        .select("*")
        .or(`authId.eq.${authUser.id},email.eq.${authUser.email}`)
        .maybeSingle();
      return refetched ? normalize(refetched) : null;
    }

    return normalize(created);
  } catch (e) {
    console.error("getSessionUser failed:", e);
    return null;
  }
}

async function touchLastSeen(admin: any, userId: string, prev: string | null) {
  try {
    const prevMs = prev ? new Date(prev).getTime() : 0;
    if (Date.now() - prevMs < LAST_SEEN_DEBOUNCE_MS) return;
    await admin.from("User").update({ lastSeenAt: new Date().toISOString() }).eq("id", userId);
  } catch {
    // Non-fatal — "active today" is a soft signal.
  }
}

function normalize(row: any): Profile {
  return {
    id: row.id,
    authId: row.authId,
    email: row.email,
    name: row.name,
    age: row.age,
    bio: row.bio,
    gender: row.gender,
    orientation: row.orientation,
    showMe: row.showMe ?? [],
    height: row.height ?? null,
    location: row.location ?? null,
    intentions: row.intentions ?? null,
    relationshipType: row.relationshipType ?? null,
    filterAgeMin: row.filterAgeMin ?? 18,
    filterAgeMax: row.filterAgeMax ?? 99,
    filterIntentions: row.filterIntentions ?? null,
    filterActiveToday: !!row.filterActiveToday,
    filterNewHere: !!row.filterNewHere,
    accessTier: row.accessTier ?? "free",
    verified: !!row.verified,
    foundingMember: !!row.foundingMember,
    paused: !!row.paused,
    qrCode: row.qrCode,
    isAdmin: !!row.isAdmin,
    lastSeenAt: row.lastSeenAt ?? null
  };
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
