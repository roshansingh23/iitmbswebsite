// Silent email-domain gate. Surface a generic message to anyone outside the
// allowlist — never reveal who is/isn't allowed.
export function isAllowedEmail(email: string): boolean {
  const allow = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").trim();
  if (!allow) return true; // unset = allow all (dev). Configure in prod.
  const domains = allow.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at < 0) return false;
  const domain = lower.slice(at + 1);
  return domains.some((d) => domain === d || domain.endsWith("." + d));
}

// The single error string the user ever sees if their email doesn't qualify.
// Intentionally generic.
export const GENERIC_REJECT_MESSAGE = "This email can't be used to sign up.";
