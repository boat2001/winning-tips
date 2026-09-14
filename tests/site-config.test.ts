import { describe, expect, it } from "vitest";
import { siteConfig } from "../lib/config/site";

describe("site configuration", () => {
  it("has unique root-relative navigation destinations", () => {
    const destinations = siteConfig.navigation.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
    expect(destinations.every((href) => href.startsWith("/"))).toBe(true);
  });

  it("uses the approved product identity", () => {
    expect(siteConfig.name).toBe("Winning Tips");
    expect(siteConfig.tagline).toBe("Predict. Win. Together.");
  });
});
