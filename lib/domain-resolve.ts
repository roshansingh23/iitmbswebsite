import { supabaseAdmin } from "./supabase-server";
import { baseDomain, domainOf, isAcademicDomain } from "./domains";
import { academicOnly } from "./auth-domain";

// Get-or-create the Domain row for an email address.
//
// Keyed on the BASE domain, so every subdomain an institution hands out
// lands on the same row — ds.study.x.ac.in and smail.x.ac.in are both
// x.ac.in, one pool, no admin step.
//
// No naming and no seed list: the base domain string is the identity. A row
// created here has `name` null and `poolId` equal to its own id.

export type ResolvedDomain = {
  id: string;
  domain: string;
  name: string | null;
  poolId: string;
};

function newId(prefix: string) {
  return prefix + globalThis.crypto.randomUUID().replace(/-/g, "");
}

const SELECT = "id,domain,name,poolId";

export async function resolveDomainForEmail(email: string): Promise<ResolvedDomain | null> {
  const admin = supabaseAdmin();
  if (!admin) return null;

  const signInDomain = domainOf(email);
  if (!signInDomain) return null;

  // Mirrors the sign-in gate. Anything the gate let through must get a
  // pool here, otherwise the member signs in fine and then cannot be
  // paired with anyone.
  if (academicOnly() && !isAcademicDomain(signInDomain)) return null;

  // Everyone at an institution shares one row regardless of which subdomain
  // their address is on.
  const domain = baseDomain(signInDomain);

  const { data: existing } = await admin
    .from("Domain")
    .select(SELECT)
    .eq("domain", domain)
    .maybeSingle();
  if (existing) return existing as ResolvedDomain;

  // First person ever from this institution. poolId is its own id.
  const id = newId("dm");
  const { data: created, error } = await admin
    .from("Domain")
    .insert({ id, domain, name: null, poolId: id })
    .select(SELECT)
    .single();

  if (error) {
    // Two people from a brand-new institution signed in at once; `domain` is
    // unique so one insert lost. Read theirs rather than failing the login.
    const { data: raced } = await admin
      .from("Domain")
      .select(SELECT)
      .eq("domain", domain)
      .maybeSingle();
    return (raced as ResolvedDomain) ?? null;
  }

  return created as ResolvedDomain;
}

// Every Domain id that shares a pool. Discover and confessions scope on
// this so the rest of the app matches what random pairing already does:
// you see the people you could be paired with, nobody else.
//
// Returns null when the caller has no pool, which callers treat as "do not
// scope" rather than "show nothing" — a legacy row should not get an empty
// app.
export async function poolDomainIds(poolId: string | null): Promise<string[] | null> {
  if (!poolId) return null;
  const admin = supabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("Domain").select("id").eq("poolId", poolId);
  const ids = ((data ?? []) as any[]).map((d) => d.id);
  return ids.length > 0 ? ids : null;
}
