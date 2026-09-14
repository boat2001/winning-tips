import { describe, expect, it } from "vitest";
import { identitySchema } from "@/lib/auth/validation";

describe("identitySchema", () => {
  it("trims the name and normalises the handle to lower case", () => {
    const parsed = identitySchema.parse({ displayName: "  Sport Guru  ", username: " BetterDaysAhead " });
    expect(parsed.displayName).toBe("Sport Guru");
    expect(parsed.username).toBe("betterdaysahead");
  });

  it("requires a name of at least two characters", () => {
    const result = identitySchema.safeParse({ displayName: "S", username: "betterdaysahead" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/at least 2/);
  });

  it("rejects handles a registration would also have rejected", () => {
    for (const username of ["ab", "has space", "has.dot", "emoji🎯", "a".repeat(31)]) {
      expect(identitySchema.safeParse({ displayName: "Sport Guru", username }).success).toBe(false);
    }
  });

  it("allows letters, digits, hyphens and underscores", () => {
    for (const username of ["sport_guru", "sport-guru", "guru2026"]) {
      expect(identitySchema.safeParse({ displayName: "Sport Guru", username }).success).toBe(true);
    }
  });
});
