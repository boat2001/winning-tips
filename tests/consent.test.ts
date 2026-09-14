import { describe, expect, it } from "vitest";
import { registrationConsents } from "@/lib/auth/consent";
import { registerSchema } from "@/lib/auth/validation";
import { legalDocuments } from "@/lib/config/legal";

const valid = {
  username: "match_fan",
  email: "fan@example.com",
  phone: "+233 24 123 4567",
  password: "Strongpass1",
  confirmPassword: "Strongpass1",
  ageConfirmed: "on",
  termsAccepted: "on",
};

describe("registration consent", () => {
  it("requires the age confirmation separately from the terms", () => {
    const { ageConfirmed: _age, ...withoutAge } = valid;
    void _age;
    const result = registerSchema.safeParse(withoutAge);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/18 or older/);
    expect(registerSchema.safeParse({ ...valid, termsAccepted: undefined }).success).toBe(false);
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("records age, terms and privacy against the current versions, and never marketing", () => {
    const grants = registrationConsents("GH", 18);
    expect(grants.map((grant) => grant.kind)).toEqual(["AGE_CONFIRMATION", "TERMS", "PRIVACY"]);
    expect(grants.every((grant) => grant.granted && grant.countryCode === "GH" && grant.source === "REGISTRATION")).toBe(true);
    expect(grants.find((grant) => grant.kind === "AGE_CONFIRMATION")?.version).toBe("18+");
    expect(grants.find((grant) => grant.kind === "TERMS")?.version).toBe(legalDocuments.terms.version);
    expect(grants.find((grant) => grant.kind === "PRIVACY")?.version).toBe(legalDocuments.privacy.version);
  });
});
