import { legalDocuments } from "@/lib/config/legal";

export type ConsentKind = "AGE_CONFIRMATION" | "TERMS" | "PRIVACY" | "MARKETING";

export interface ConsentGrant {
  readonly kind: ConsentKind;
  readonly granted: boolean;
  /** Document version for TERMS and PRIVACY; the minimum age for AGE_CONFIRMATION. */
  readonly version: string;
  readonly countryCode: string;
  readonly source: "REGISTRATION" | "PROFILE";
}

/**
 * The consents a completed registration records.
 *
 * Only the three the form requires. Marketing is never recorded as granted at
 * sign-up because it is never pre-checked (§14.2); it gets its own record when
 * a member opts in later.
 */
export function registrationConsents(countryCode: string, minimumAge: number): ConsentGrant[] {
  const base = { granted: true, countryCode, source: "REGISTRATION" } as const;
  return [
    { ...base, kind: "AGE_CONFIRMATION", version: `${minimumAge}+` },
    { ...base, kind: "TERMS", version: legalDocuments.terms.version },
    { ...base, kind: "PRIVACY", version: legalDocuments.privacy.version },
  ];
}
