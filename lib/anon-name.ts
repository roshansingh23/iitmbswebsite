// ──────────────────────────────────────────────────────────────────────────
// Anonymous display names.
//
// Random chat is anonymous. `User.name` — the real name from the OAuth
// identity — is kept in the database but never sent to the other side of a
// random chat. What the stranger sees is `User.displayName`: a handle the
// member picks for themselves.
//
// Nobody is forced to pick one. A member with no displayName falls back to
// a per-session generated alias (aliasFor in lib/random.ts), so a brand-new
// account can be chatting immediately.
//
// Real identity becomes visible only when BOTH sides publish it — the
// reveal flow, which mints a real Conversation and moves them out of here.
// ──────────────────────────────────────────────────────────────────────────

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;

// Handles that would let someone pose as staff or as the product itself.
const RESERVED = [
  "admin", "administrator", "mod", "moderator", "support", "staff",
  "official", "system", "help", "helpdesk", "team", "mismatched",
  "security", "root", "owner"
];

// Control characters, zero-width joiners and bidi overrides. People use
// these to smuggle lookalike handles past a length or lookup check. Written
// as escapes so this file stays readable plain text.
const INVISIBLE = new RegExp(
  "[" +
  "\u0000-\u001F" +   // C0 controls
  "\u007F-\u009F" +   // DEL + C1 controls
  "\u00AD" +            // soft hyphen
  "\u200B-\u200F" +   // zero-width space/joiners, LTR/RTL marks
  "\u202A-\u202E" +   // bidi embedding/override
  "\u2060-\u2064" +   // word joiner, invisible operators
  "\u2066-\u2069" +   // bidi isolates
  "\uFEFF" +            // BOM / zero-width no-break space
  "]",
  "g"
);

// Contact details dressed up as a name. The label before the dot may be a
// single character so "t.me" is caught, while ordinary initials survive
// because the part after the dot has to be a real TLD ("J.R. Patel" is fine,
// "R" is not a TLD).
const LINKISH =
  /\b[a-z0-9][a-z0-9-]*\.(com|net|org|edu|gov|info|biz|in|io|co|ly|me|gg|to|cc|xyz|app|dev|site|link|page|uk|us|ru|tk)\b/i;

export type NameCheck =
  | { ok: true; value: string }
  | { ok: false; error: string };

// Returns the cleaned handle, or the reason it was rejected. The message is
// shown to the member verbatim, so it says what to fix rather than which
// rule was broken.
export function sanitizeDisplayName(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, error: "Pick a name." };

  const cleaned = raw.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();

  if (cleaned.length === 0) return { ok: false, error: "Pick a name." };
  if (cleaned.length < DISPLAY_NAME_MIN) {
    return { ok: false, error: `At least ${DISPLAY_NAME_MIN} characters.` };
  }
  if (cleaned.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: `Keep it under ${DISPLAY_NAME_MAX} characters.` };
  }

  // No contact details in a handle — the whole point of the anonymous layer
  // is that you decide when to hand those over.
  if (/@/.test(cleaned) || /:\/\//.test(cleaned) || LINKISH.test(cleaned)) {
    return { ok: false, error: "No email addresses or links in your name." };
  }
  if (/\d{6,}/.test(cleaned)) {
    return { ok: false, error: "That looks like a phone number." };
  }

  // Letters (any script), digits, spaces and a few joiners. Emoji and
  // symbols are out — they make impersonation and spoofing easy.
  if (!/^[\p{L}\p{M}\p{N} _'.-]+$/u.test(cleaned)) {
    return { ok: false, error: "Letters, numbers, spaces and - _ . ' only." };
  }
  // Must contain at least one letter, so "..." or "123" is not a name.
  if (!/\p{L}/u.test(cleaned)) {
    return { ok: false, error: "Use at least one letter." };
  }

  // Fold punctuation away before checking reserved words, so "A_d-m.i'n"
  // cannot be used to impersonate staff.
  const folded = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  if (RESERVED.includes(folded)) {
    return { ok: false, error: "That name is reserved." };
  }

  return { ok: true, value: cleaned };
}
