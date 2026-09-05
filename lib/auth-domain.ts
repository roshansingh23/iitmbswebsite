// Email gate for sign-in.
//
// Any well-formed email address is accepted by default. Whichever domain
// they sign in with becomes their pool — resolved later in lib/session.ts,
// where the Domain row is created or attached.
//
// Two ways to narrow it, in precedence order:
//   1. ALLOWED_EMAIL_DOMAINS set → only those domains and their subdomains.
//      Use this to run a closed pilot on one or two campuses.
//   2. ACADEMIC_ONLY=true        → only academic domains (.edu, .ac.in,
//      .ac.uk …). This was the old default; set it to get it back.
//   3. neither                   → everyone.

import { domainOf, isAcademicDomain } from "./domains";

function envAllowlist(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function academicOnly(): boolean {
  return (process.env.ACADEMIC_ONLY ?? "").trim().toLowerCase() === "true";
}

export function isAllowedEmail(email: string): boolean {
  // Still has to look like an email — domainOf rejects anything without a
  // sane domain part, so a malformed address never reaches the database.
  const domain = domainOf(email);
  if (!domain) return false;

  const pinned = envAllowlist();
  if (pinned.length > 0) {
    return pinned.some((d) => domain === d || domain.endsWith("." + d));
  }

  if (academicOnly()) return isAcademicDomain(domain);

  return true;
}

// Shown verbatim on the login screen when the gate rejects someone. Kept
// generic on purpose — we say what to do, never which specific domains are
// on a pilot allowlist, so a closed rollout isn't enumerable.
export const GENERIC_REJECT_MESSAGE =
  "That email can't be used to sign in.";
