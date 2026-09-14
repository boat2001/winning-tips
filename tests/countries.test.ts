import { describe, expect, it } from "vitest";
import { countries, enabledCountries, isCountryCode, launchCountry, resolveMemberCountry } from "@/lib/config/countries";

describe("country editions", () => {
  it("recognises only configured country codes", () => {
    expect(isCountryCode("GH")).toBe(true);
    expect(isCountryCode("NG")).toBe(true);
    for (const value of ["gh", "KE", "", null, undefined, 42, "constructor", "toString"]) {
      expect(isCountryCode(value)).toBe(false);
    }
  });

  it("lists only live editions as choosable", () => {
    const codes = enabledCountries().map((country) => country.countryCode);
    expect(codes).toContain("GH");
    for (const code of codes) expect(countries[code].enabled).toBe(true);
  });

  it("honours an explicit, live choice", () => {
    expect(resolveMemberCountry("GH")).toBe(countries.GH);
  });

  it("falls back to the launch edition rather than an empty store", () => {
    expect(resolveMemberCountry(null)).toBe(launchCountry);
    expect(resolveMemberCountry("ZZ")).toBe(launchCountry);
    // Nigeria is configured but not live, so choosing it must not open an empty edition.
    if (!countries.NG.enabled) expect(resolveMemberCountry("NG")).toBe(launchCountry);
  });

  it("gives every edition its own currency and SportyBet site", () => {
    expect(countries.GH).toMatchObject({ currency: "GHS", sportyBetRegion: "gh" });
    expect(countries.NG).toMatchObject({ currency: "NGN", sportyBetRegion: "ng" });
  });
});
