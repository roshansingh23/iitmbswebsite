// ──────────────────────────────────────────────────────────────────────────
// Interests — a SOFT pairing signal.
//
// Shared tags push someone up the queue; they never filter anyone out.
// pair_random() adds 2 per overlap capped at 6, and the cap is what keeps
// this soft: waiting time accrues at 0.1/sec, so after about a minute the
// longest waiter outranks any amount of shared taste. Someone with no
// interests at all is still paired normally, just without the boost.
// ──────────────────────────────────────────────────────────────────────────

export const MAX_INTERESTS = 8;

// Slugs are what land in the database. Keep them stable — changing one
// silently unmatches everyone who picked it.
export const INTERESTS: { slug: string; label: string; group: string }[] = [
  { slug: "music",       label: "Music",            group: "Listening" },
  { slug: "hiphop",      label: "Hip-hop",          group: "Listening" },
  { slug: "indie",       label: "Indie",            group: "Listening" },
  { slug: "classical",   label: "Classical",        group: "Listening" },
  { slug: "podcasts",    label: "Podcasts",         group: "Listening" },

  { slug: "films",       label: "Films",            group: "Watching" },
  { slug: "anime",       label: "Anime",            group: "Watching" },
  { slug: "kdrama",      label: "K-drama",          group: "Watching" },
  { slug: "cricket",     label: "Cricket",          group: "Watching" },
  { slug: "football",    label: "Football",         group: "Watching" },
  { slug: "f1",          label: "F1",               group: "Watching" },

  { slug: "books",       label: "Books",            group: "Making & thinking" },
  { slug: "writing",     label: "Writing",          group: "Making & thinking" },
  { slug: "art",         label: "Art",              group: "Making & thinking" },
  { slug: "photography", label: "Photography",      group: "Making & thinking" },
  { slug: "design",      label: "Design",           group: "Making & thinking" },
  { slug: "startups",    label: "Startups",         group: "Making & thinking" },
  { slug: "coding",      label: "Coding",           group: "Making & thinking" },
  { slug: "ai",          label: "AI",               group: "Making & thinking" },
  { slug: "philosophy",  label: "Philosophy",       group: "Making & thinking" },
  { slug: "politics",    label: "Politics",         group: "Making & thinking" },
  { slug: "finance",     label: "Finance",          group: "Making & thinking" },

  { slug: "gaming",      label: "Gaming",           group: "Doing" },
  { slug: "gym",         label: "Gym",              group: "Doing" },
  { slug: "running",     label: "Running",          group: "Doing" },
  { slug: "dance",       label: "Dance",            group: "Doing" },
  { slug: "cooking",     label: "Cooking",          group: "Doing" },
  { slug: "travel",      label: "Travel",           group: "Doing" },
  { slug: "trekking",    label: "Trekking",         group: "Doing" },
  { slug: "chess",       label: "Chess",            group: "Doing" },

  { slug: "latenight",   label: "Late nights",      group: "How you are" },
  { slug: "earlybird",   label: "Early mornings",   group: "How you are" },
  { slug: "introvert",   label: "Introvert",        group: "How you are" },
  { slug: "extrovert",   label: "Extrovert",        group: "How you are" },
  { slug: "overthinker", label: "Overthinker",      group: "How you are" },
  { slug: "memes",       label: "Memes",            group: "How you are" },
  { slug: "debate",      label: "Arguing for fun",  group: "How you are" },
  { slug: "quiet",       label: "Quiet company",    group: "How you are" }
];

const BY_SLUG = new Map(INTERESTS.map((i) => [i.slug, i]));

export function isKnownInterest(slug: string): boolean {
  return BY_SLUG.has(slug);
}

export function labelFor(slug: string): string {
  return BY_SLUG.get(slug)?.label ?? slug;
}

export const INTEREST_GROUPS: string[] = Array.from(
  new Set(INTERESTS.map((i) => i.group))
);

// Only known slugs survive, de-duplicated and capped. Unknown values are
// dropped rather than rejected — a stale tag from an old client should not
// fail the whole save.
export function sanitizeInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const slug = v.trim().toLowerCase();
    if (!isKnownInterest(slug) || out.includes(slug)) continue;
    out.push(slug);
    if (out.length >= MAX_INTERESTS) break;
  }
  return out;
}
