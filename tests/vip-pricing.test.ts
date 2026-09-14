import { describe, expect, it } from "vitest";
import { automaticVipPrice, priceWithinRange, vipPriceRanges } from "@/lib/vip/pricing";

describe("evidence-based VIP prices", () => {
  it("uses the owner's launch floors without a sufficient track record", () => {
    expect(automaticVipPrice("VIP1", 0, 0).priceMinor).toBe(4000);
    expect(automaticVipPrice("VIP2", 29, 29).priceMinor).toBe(8000);
    expect(automaticVipPrice("VIP3", 0, 0).priceMinor).toBe(17000);
  });
  it("raises prices only as the conservative whole-slip record improves", () => {
    expect(automaticVipPrice("VIP1", 50, 100).priceMinor).toBe(4000);
    expect(automaticVipPrice("VIP1", 80, 100).priceMinor).toBeGreaterThan(4000);
    expect(automaticVipPrice("VIP1", 100, 100).priceMinor).toBe(5000);
  });
  it("keeps every permitted outcome within the configured range", () => {
    for (const category of Object.keys(vipPriceRanges) as Array<keyof typeof vipPriceRanges>) {
      for (let wins = 0; wins <= 100; wins++) expect(priceWithinRange(category, automaticVipPrice(category, wins, 100).priceMinor)).toBe(true);
    }
    expect(priceWithinRange("VIP3", 16999)).toBe(false);
    expect(priceWithinRange("VIP2", 10001)).toBe(false);
    expect(() => automaticVipPrice("VIP1", 5, 3)).toThrow();
  });
});
