// Silent email-domain gate. Anyone outside the allowlist sees a generic
// rejection — never reveal which domain qualifies.

// Open for now. To re-enable iitm.ac.in restriction:
//   - set DEFAULT_DOMAINS back to ["iitm.ac.in"], OR
//   - set ALLOWED_EMAIL_DOMAINS=iitm.ac.in on Vercel
const DEFAULT_DOMAINS: string[] = [];

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

export const GENERIC_REJECT_MESSAGE = "This email can't be used to sign up.";
