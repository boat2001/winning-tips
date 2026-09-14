export const countries = {
  GH: { countryCode: "GH", name: "Ghana", currency: "GHS", locale: "en-GH", timezone: "Africa/Accra", serviceMode: "PREDICTIONS_ONLY", minimumUserAge: 18, enabled: true, paymentsEnabled: true, sportyBetRegion: "gh", sports: ["football", "basketball", "tennis"] },
  NG: { countryCode: "NG", name: "Nigeria", currency: "NGN", locale: "en-NG", timezone: "Africa/Lagos", serviceMode: "DISABLED", minimumUserAge: 18, enabled: false, paymentsEnabled: false, sportyBetRegion: "ng", sports: ["football", "basketball", "tennis"] },
} as const;

export const launchCountry = countries.GH;

/** Preview records are opt-in and cannot be enabled in a production build. */
export function isDesignPreview() {
  return process.env.NODE_ENV === "development" && process.env.DESIGN_PREVIEW === "true";
}

export type CountryCode = keyof typeof countries;
export type CountryConfig = (typeof countries)[CountryCode];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && Object.hasOwn(countries, value);
}

/** Editions a member can choose. A disabled country stays listed as "coming later". */
export function enabledCountries(): CountryConfig[] {
  return Object.values(countries).filter((country) => country.enabled);
}

/**
 * The edition whose cards a member sees and buys.
 *
 * An explicit, enabled choice wins. Anything else, including a country that was
 * switched off after the member chose it, falls back to the launch edition
 * rather than showing an empty store.
 */
export function resolveMemberCountry(code: string | null | undefined): CountryConfig {
  return isCountryCode(code) && countries[code].enabled ? countries[code] : launchCountry;
}
