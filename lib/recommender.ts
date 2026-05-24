// Discover recommendation engine.
//
// Takes the SQL-eligible pool of candidates (already filtered for gender,
// age, blocks, not-already-hooked, not-paused) and reorders it with a
// multi-signal score:
//
//   1. Interest overlap        — same intentions / location / age proximity / founding cohort
//   2. Engagement quality       — verified, photos count, prompts count, lastSeenAt freshness
//   3. Pass decay               — heavy negative if I passed in the last 7 days
//   4. Recency shuffle          — small randomised jitter so two opens of /discover are not identical
//
// The fifth signal in the brief (collaborative-filter via precomputed
// similarity) is left out for the free-tier build — it needs a nightly cron
// and impression storage that the 5GB egress budget can't afford for a
// 15-day event. Easy to add later by reading from a UserSimilarity table.
//
// Pure function — no DB calls, easy to unit-test against synthetic inputs.

export type Me = {
  id: string;
  age: number | null;
  location: string | null;
  intentions: string | null;
  relationshipType: string | null;
  foundingMember: boolean;
};

export type CandidateInput = {
  id: string;
  age: number | null;
  location: string | null;
  intentions: string | null;
  relationshipType: string | null;
  verified: boolean;
  foundingMember: boolean;
  lastSeenAt: string | null;
  createdAt: string | null;
  photoCount: number;
  promptCount: number;
};

export type ScoreBreakdown = {
  interest: number;
  engagement: number;
  passDecay: number;
  jitter: number;
  total: number;
};

export type RankedCandidate<C extends CandidateInput> = C & {
  _score: number;
  _breakdown: ScoreBreakdown;
};

const PASS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const NEW_HERE_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_TODAY_MS = 24 * 60 * 60 * 1000;

export function rankCandidates<C extends CandidateInput>(
  me: Me,
  pool: C[],
  passedAt: Map<string, string>,
  limit = 30
): RankedCandidate<C>[] {
  const scored: RankedCandidate<C>[] = pool.map((c) => {
    const breakdown: ScoreBreakdown = {
      interest: interestOverlap(me, c),
      engagement: engagementQuality(c),
      passDecay: passPenalty(c, passedAt),
      jitter: Math.random() * 2,
      total: 0
    };
    breakdown.total =
      breakdown.interest +
      breakdown.engagement +
      breakdown.passDecay +
      breakdown.jitter;
    return { ...c, _score: breakdown.total, _breakdown: breakdown };
  });

  scored.sort((a, b) => b._score - a._score);

  // Band-shuffle: profiles whose scores are within BAND of each other get
  // their order randomized each render. Without this the same top-5 lock
  // at the top of the deck across reloads — quality stays high but two
  // visits to /discover feel fresh instead of identical.
  const BAND = 3;
  let bandStart = 0;
  for (let i = 1; i <= scored.length; i++) {
    if (i === scored.length || scored[bandStart]._score - scored[i]._score > BAND) {
      // Fisher–Yates shuffle on [bandStart, i)
      for (let j = i - 1; j > bandStart; j--) {
        const k = bandStart + Math.floor(Math.random() * (j - bandStart + 1));
        [scored[j], scored[k]] = [scored[k], scored[j]];
      }
      bandStart = i;
    }
  }

  return scored.slice(0, limit);
}

function interestOverlap(me: Me, c: CandidateInput): number {
  let s = 0;
  if (me.intentions && c.intentions && me.intentions === c.intentions) s += 3;
  if (me.relationshipType && c.relationshipType && me.relationshipType === c.relationshipType) s += 2;
  if (me.location && c.location && me.location === c.location) s += 4;
  if (me.age != null && c.age != null) {
    const diff = Math.abs(Number(me.age) - Number(c.age));
    if (diff <= 3) s += 2;
    else if (diff <= 6) s += 1;
  }
  if (me.foundingMember && c.foundingMember) s += 1;
  return s;
}

function engagementQuality(c: CandidateInput): number {
  let s = 0;
  // Profile completeness
  if (c.photoCount >= 3) s += 2;
  else if (c.photoCount >= 1) s += 1;
  if (c.promptCount >= 3) s += 2;
  else if (c.promptCount >= 1) s += 1;
  if (c.verified) s += 1;

  // Activity freshness
  if (c.lastSeenAt) {
    const ageMs = Date.now() - new Date(c.lastSeenAt).getTime();
    if (ageMs < ACTIVE_TODAY_MS) s += 2;
    else if (ageMs < 3 * ACTIVE_TODAY_MS) s += 1;
  }

  // Novelty boost for newcomers — keeps them from getting buried
  if (c.createdAt) {
    const ageMs = Date.now() - new Date(c.createdAt).getTime();
    if (ageMs < NEW_HERE_MS) s += 2;
  }
  return s;
}

function passPenalty(c: CandidateInput, passedAt: Map<string, string>): number {
  const when = passedAt.get(c.id);
  if (!when) return 0;
  const ageMs = Date.now() - new Date(when).getTime();
  if (ageMs > PASS_WINDOW_MS) return 0;
  // Linear ramp back toward zero over the 7-day window.
  const remaining = 1 - ageMs / PASS_WINDOW_MS;
  return -20 * remaining;
}
