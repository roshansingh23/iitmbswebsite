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
  accessTier: string;
  verified: boolean;
  foundingMember: boolean;
  paused: boolean;
  qrCode: string | null;
  isAdmin: boolean;
};

// Returns the joined user — Supabase auth identity + our public.User profile.
// Uses the service_role key for DB access, so it works WITHOUT a Postgres
// password. Never throws; returns null on any failure so calling pages can
// redirect cleanly to /login.
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

    // Look for existing profile keyed to this auth.users id.
    const { data: existing } = await admin
      .from("User")
      .select("*")
      .eq("authId", authUser.id)
      .maybeSingle();

    if (existing) {
      return normalize(existing);
    }

    // First touch — create a minimal profile row. authId column is UUID, the
    // rest get safe defaults from the schema.
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null;

    const id = "c" + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);
    const { data: created, error } = await admin
      .from("User")
      .insert({
        id,
        authId: authUser.id,
        email: authUser.email,
        name,
        qrCode: randomQrCode(),
        showMe: [],
        accessTier: "free"
      })
      .select("*")
      .single();

    if (error) {
      // Race or unique-constraint — re-fetch.
      const { data: refetched } = await admin
        .from("User")
        .select("*")
        .eq("authId", authUser.id)
        .maybeSingle();
      return refetched ? normalize(refetched) : null;
    }

    return normalize(created);
  } catch (e) {
    console.error("getSessionUser failed:", e);
    return null;
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
    accessTier: row.accessTier ?? "free",
    verified: !!row.verified,
    foundingMember: !!row.foundingMember,
    paused: !!row.paused,
    qrCode: row.qrCode,
    isAdmin: !!row.isAdmin
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
