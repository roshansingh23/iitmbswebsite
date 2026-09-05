// ──────────────────────────────────────────────────────────────────────────
// Email domains.
//
// People are grouped by the BASE domain they sign in with — one row per
// institution, not per subdomain. Institutions hand out addresses on any
// number of subdomains, and everyone on them belongs in the same pool:
//
//   ds.study.x.ac.in  ─┐
//   smail.x.ac.in     ─┼─►  x.ac.in
//   x.ac.in           ─┘
//
// The base domain is one label in front of the public suffix, so the split
// happens at the institution, never above or below it. That is the only
// inference this file makes. It still never invents a display NAME: `name`
// stays null until a human sets it, and the UI shows the raw base domain
// until then.
//
// Two base domains that are genuinely the same place are merged by pointing
// their `poolId` at the same value. That one is an admin action.
// ──────────────────────────────────────────────────────────────────────────

// Public suffixes that mark an academic institution. Used only by the
// sign-in gate to decide whether an email is a student address at all.
const ACADEMIC_SUFFIXES = [
  "edu",                                 // US and many others
  "ac.in", "edu.in", "res.in",           // India
  "ac.uk",                               // UK
  "edu.au", "ac.nz",                     // AU / NZ
  "ac.jp", "edu.sg", "edu.my", "ac.kr",  // APAC
  "edu.pk", "edu.bd", "edu.np", "ac.lk", // South Asia
  "edu.cn", "ac.za", "edu.br", "edu.mx"
];

export function domainOf(email: string): string | null {
  const lower = (email ?? "").trim().toLowerCase();

  // Whitespace anywhere, or more than one @, is not an address we accept.
  if (/\s/.test(lower)) return null;
  const at = lower.indexOf("@");
  if (at < 0 || at !== lower.lastIndexOf("@")) return null;

  // Both halves have to exist. An empty local part ("@example.com") is not
  // an address, and the gate lets anything through now, so this is the only
  // thing standing between a junk string and a User row.
  const local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  if (!local || !domain) return null;

  // Domain has to look like a domain: labels of permitted characters,
  // separated by single dots, with a real TLD on the end.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domain)) {
    return null;
  }
  return domain;
}

// True when the domain is, or sits under, a recognised academic suffix.
export function isAcademicDomain(domain: string): boolean {
  return ACADEMIC_SUFFIXES.some((s) => domain === s || domain.endsWith("." + s));
}

// Multi-label public suffixes outside the academic set. Without these the
// "last two labels" fallback gets it wrong in exactly the way that matters:
// yahoo.co.in would collapse to "co.in" and pool every Indian Yahoo user
// with every other one.
const COMPOUND_SUFFIXES = [
  "co.uk", "org.uk", "net.uk", "gov.uk", "me.uk",
  "co.in", "net.in", "org.in", "gen.in", "firm.in", "gov.in",
  "co.jp", "or.jp", "ne.jp", "co.kr", "or.kr",
  "co.nz", "net.nz", "org.nz",
  "co.za", "org.za",
  "com.au", "net.au", "org.au", "gov.au",
  "com.br", "com.cn", "com.mx", "com.sg", "com.my", "com.tr",
  "com.hk", "com.tw", "com.ph", "com.vn", "com.pk", "com.bd", "com.np"
];

// Every suffix we know, longest match wins — so "x.edu.in" resolves against
// "edu.in" rather than being mistaken for a subdomain of "edu".
const ALL_SUFFIXES = [...ACADEMIC_SUFFIXES, ...COMPOUND_SUFFIXES];

function suffixOf(domain: string, list: string[]): string | null {
  let best: string | null = null;
  for (const s of list) {
    if (domain === s || domain.endsWith("." + s)) {
      if (!best || s.length > best.length) best = s;
    }
  }
  return best;
}

// Collapse a sign-in domain to the institution that owns it — the single
// label in front of the public suffix.
//
//   ds.study.iitm.ac.in  →  iitm.ac.in     (suffix ac.in)
//   students.nitt.edu    →  nitt.edu       (suffix edu)
//   goa.bits-pilani.ac.in→  bits-pilani.ac.in
//
// For a domain under no known suffix we fall
// back to the last two labels, which is the right answer for the ordinary
// mail providers people would sign up with.
export function baseDomain(domain: string): string {
  const d = (domain ?? "").trim().toLowerCase();
  if (!d) return d;

  const suffix = suffixOf(d, ALL_SUFFIXES);
  if (!suffix) {
    const labels = d.split(".");
    return labels.length <= 2 ? d : labels.slice(-2).join(".");
  }
  // The domain IS the suffix (never a real address, but do not crash).
  if (d === suffix) return d;

  const stem = d.slice(0, d.length - suffix.length - 1);
  const owner = stem.split(".").pop() ?? "";
  return owner ? owner + "." + suffix : d;
}

// What to show for a domain row. The name if someone has set one, the base
// domain otherwise — never a guessed institution name.
export function domainLabel(row: { domain: string; name: string | null }): string {
  return row.name?.trim() || row.domain;
}
