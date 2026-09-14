import { describe, expect, it } from "vitest";
import { getSiteUrl, siteConfig } from "../lib/config/site";

describe("getSiteUrl", () => {
  it("prefers the configured public URL", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_APP_URL: "https://winning-tips.com", VERCEL_URL: "x.vercel.app" }).origin).toBe("https://winning-tips.com");
  });

  it("treats a blank public URL as unset and falls back to the Vercel domains", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_APP_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "winning-tips.vercel.app", VERCEL_URL: "x.vercel.app" }).origin).toBe("https://winning-tips.vercel.app");
    expect(getSiteUrl({ NEXT_PUBLIC_APP_URL: "  ", VERCEL_URL: "x.vercel.app" }).origin).toBe("https://x.vercel.app");
  });

  it("falls back to localhost outside Vercel", () => {
    expect(getSiteUrl({}).origin).toBe("http://localhost:3000");
  });
});

describe("site configuration", () => {
  it("has unique root-relative navigation destinations", () => {
    const destinations = siteConfig.navigation.map((item) => item.href);

    expect(new Set(destinations).size).toBe(destinations.length);
    expect(destinations.every((href) => href.startsWith("/"))).toBe(true);
  });

  it("uses the approved product identity", () => {
    expect(siteConfig.name).toBe("Winning Tips");
    expect(siteConfig.tagline).toBe("Get the tips. Win the cash.");
  });
});
