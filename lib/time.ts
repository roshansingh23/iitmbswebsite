// Truncate a date to the start of its ISO week (Monday 00:00 UTC). Used to
// scope "1 rose per week" — `(fromUserId, weekOf)` is the uniqueness key.
export function startOfIsoWeek(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // Sun = 0 → 7
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

export function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
