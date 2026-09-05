// ──────────────────────────────────────────────────────────────────────────
// Message screening for random chat.
//
// Two tiers, because a filter that only blocks is a filter people route
// around, and one that only logs protects nobody:
//
//   "block" — refuse the message and tell the sender why. Reserved for
//             things with no legitimate reading.
//   "flag"  — deliver it, but raise a moderation report. Used for contact
//             details and solicitation, which are often innocent and
//             sometimes the first move of a scam. The recipient still sees
//             it; a human decides later.
//   "clean" — nothing to do.
//
// Three views of the same message, because one normalisation cannot serve
// both jobs:
//
//   raw     — lowercased, whitespace collapsed. Digits, @ and dots intact.
//             Contact details are matched here: leet-decoding would turn a
//             phone number into letters and an email's @ into an "a".
//   spaced  — leet decoded, word spacing preserved. For patterns that need
//             a word boundary ("kys" must not fire inside "monkeys").
//   compact — leet decoded with every separator removed. Defeats padding
//             like "s e n d   m e   n u d e s" no matter how wide the gaps.
//
// The severe list is intentionally short and English-only. Extend it for
// your community with MODERATION_BLOCKLIST (comma-separated) rather than
// editing this file — that keeps deploys and word lists separate.
// ──────────────────────────────────────────────────────────────────────────

export type Verdict =
  | { action: "clean" }
  | { action: "flag"; reason: string }
  | { action: "block"; reason: string; message: string };

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", "$": "s", "!": "i", "|": "i", "+": "t"
};

export type Views = { raw: string; spaced: string; compact: string };

export function views(input: string): Views {
  const raw = input.toLowerCase().replace(/\s+/g, " ").trim();

  // Leet decoding is destructive to digits and @, so it only feeds the two
  // word-matching views — never the contact-detail one.
  const decoded = raw.replace(/[0134578@$!|+]/g, (c) => LEET[c] ?? c);

  const spaced = decoded
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .trim();

  const compact = decoded
    .replace(/[^a-z0-9]+/g, "")
    .replace(/(.)\1{2,}/g, "$1$1");

  return { raw, spaced, compact };
}

// Kept for callers that just want the comparable text.
export function normalize(input: string): string {
  return views(input).spaced;
}

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

type Rule = { re: RegExp; on: keyof Views; reason: string };

// Unambiguous sexual harassment and threat phrasing. Slur lists belong in
// MODERATION_BLOCKLIST, not in source control.
//
// Most run on `compact`, which is immune to spacing tricks. Short tokens
// that could hide inside a longer word run on `spaced` so the word boundary
// still applies.
const SEVERE: Rule[] = [
  { re: /sendme(?:your)?nudes?/,          on: "compact", reason: "solicits sexual images" },
  { re: /nudes?(?:pls|please|now)/,       on: "compact", reason: "solicits sexual images" },
  { re: /iwill(?:kill|rape|hurt|find)you/, on: "compact", reason: "threat of violence" },
  { re: /(?:kill|hang)yourself/,          on: "compact", reason: "encourages self-harm" },
  { re: /\bkys\b/,                        on: "spaced",  reason: "encourages self-harm" },
  { re: /underage.{0,20}(?:sex|nude)/,    on: "compact", reason: "sexual content involving minors" },
  { re: /\b(?:13|14|15|16)\s*(?:yo|yrs?|years? old)\b.{0,30}\bsex\b/, on: "raw", reason: "sexual content involving minors" }
];

// Contact details and money. Delivered, but reported — this is the shape
// most romance scams take in the first few messages. All matched on `raw`
// so digits and punctuation survive.
const FLAGS: Rule[] = [
  { re: /\b[6-9]\d{9}\b/,                                     on: "raw", reason: "phone number" },
  { re: /\b\d[\d\s-]{8,}\d\b/,                                on: "raw", reason: "possible phone number" },
  { re: /[a-z0-9._%+-]+\s*(?:@|\(at\)|\sat\s)\s*[a-z0-9.-]+\.[a-z]{2,}/, on: "raw", reason: "email address" },
  { re: /\b(?:whats\s?app|telegram|snap\s?chat|insta\s?gram|discord)\b/, on: "raw", reason: "moves to another platform" },
  { re: /\b(?:upi|paytm|gpay|phonepe|bank account|ifsc)\b/,   on: "raw", reason: "payment details" },
  { re: /\b(?:send|transfer|need|lend)\s+(?:me\s+)?(?:some\s+)?(?:money|cash|rs\.?|rupees)\b/, on: "raw", reason: "asks for money" }
];

export function screenMessage(input: string): Verdict {
  const v = views(input);
  if (!v.raw) return { action: "clean" };

  // Operator-supplied blocklist first — it is the tunable one. Matched on
  // compact so spacing and leet cannot walk a term past it.
  for (const word of envList("MODERATION_BLOCKLIST")) {
    const w = views(word).compact;
    if (w && v.compact.includes(w)) {
      return {
        action: "block",
        reason: "blocklisted term",
        message: "That message breaks the community guidelines."
      };
    }
  }

  for (const rule of SEVERE) {
    if (rule.re.test(v[rule.on])) {
      return {
        action: "block",
        reason: rule.reason,
        message: "That message breaks the community guidelines."
      };
    }
  }

  for (const rule of FLAGS) {
    if (rule.re.test(v[rule.on])) return { action: "flag", reason: rule.reason };
  }

  return { action: "clean" };
}
