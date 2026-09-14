export function slipSchedule(kickoffs: string[], providerDeadline: string, now = new Date()) {
  if (!kickoffs.length) throw new Error("A slip must contain at least one match.");
  const times = kickoffs.map((value) => new Date(value).getTime());
  const expiry = new Date(providerDeadline).getTime();
  if (times.some((value) => !Number.isFinite(value)) || !Number.isFinite(expiry)) throw new Error("This slip has an invalid match time.");
  const firstKickoff = new Date(Math.min(...times));
  const deadline = new Date(Math.min(firstKickoff.getTime(), expiry));
  if (deadline <= now) throw new Error("This slip has started or expired. Load a slip whose matches have not kicked off.");
  return { deadline, bookingDate: firstKickoff.toISOString().slice(0, 10) };
}
