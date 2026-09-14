export const vipPriceRanges = {
  VIP1: { min: 4_000, max: 5_000 },
  VIP2: { min: 8_000, max: 10_000 },
  VIP3: { min: 17_000, max: 20_000 },
} as const;

export type VipCategory = keyof typeof vipPriceRanges;

/** Historical whole-slip outcomes, not editorial confidence or bookmaker odds.
 * A conservative 95% Wilson lower bound prevents tiny samples driving a premium.
 * This pricing signal is not a forecast of today's slip or a promised win rate.
 */
export function automaticVipPrice(category: VipCategory, wins: number, settled: number) {
  const range = vipPriceRanges[category];
  if (!Number.isInteger(wins) || !Number.isInteger(settled) || wins < 0 || settled < wins) throw new Error("Invalid pricing history.");
  if (settled < 30) return { priceMinor: range.min, wins, settled, lowerBound: null, reason: "launch-baseline" as const };
  const z2 = 1.96 ** 2;
  const rate = wins / settled;
  const lowerBound = (rate + z2 / (2 * settled) - 1.96 * Math.sqrt((rate * (1 - rate) + z2 / (4 * settled)) / settled)) / (1 + z2 / settled);
  const strength = Math.min(1, Math.max(0, (lowerBound - 0.5) / 0.3));
  const priceMinor = Math.min(range.max, Math.max(range.min, Math.round((range.min + strength * (range.max - range.min)) / 100) * 100));
  return { priceMinor, wins, settled, lowerBound, reason: "historical-slip-results" as const };
}

export function priceWithinRange(category: VipCategory, amountMinor: number) {
  return Number.isInteger(amountMinor) && amountMinor >= vipPriceRanges[category].min && amountMinor <= vipPriceRanges[category].max;
}
