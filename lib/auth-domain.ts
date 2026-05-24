// Silent email-domain gate. Anyone outside the allowlist sees a generic
// rejection — never reveal which domain qualifies.

// Restricted to IITM emails. The subdomain match in isAllowedEmail covers
// every IITM domain — iitm.ac.in, smail.iitm.ac.in, ds.study.iitm.ac.in,
// study.iitm.ac.in, etc. Override with ALLOWED_EMAIL_DOMAINS on Vercel if
// the allowlist needs to change without a redeploy.
const DEFAULT_DOMAINS: string[] = ["iitm.ac.in"];

function allowlist(): string[] {
  const fromEnv = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").trim();
  if (!fromEnv) return DEFAULT_DOMAINS;
  return fromEnv.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const domains = allowlist();
  if (domains.length === 0) return true;
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at < 0) return false;
  const domain = lower.slice(at + 1);
  return domains.some((d) => domain === d || domain.endsWith("." + d));
}

export const GENERIC_REJECT_MESSAGE = "Only IITM student email allowed.";
