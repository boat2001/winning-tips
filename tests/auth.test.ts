import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/lib/auth/validation";
import { normalizeInternationalPhone, removeLeadingTrunkZero } from "@/lib/auth/phone";
import { isProtectedSuperAdminUsername } from "@/lib/auth/protected-admins";

describe("authentication", () => {
  it("normalizes registration identity and enforces matching strong passwords", () => {
    const result = registerSchema.parse({ username: "  Match_Fan  ", email: " FAN@EXAMPLE.COM ", phone: "+233 24 123 4567", password: "Strongpass1", confirmPassword: "Strongpass1", ageConfirmed: "on", termsAccepted: "on" });
    expect(result.username).toBe("match_fan");
    expect(result.email).toBe("fan@example.com");
    expect(() => registerSchema.parse({ ...result, phone: "" })).toThrow(/valid phone number/);
    expect(() => registerSchema.parse({ ...result, password: "weak", confirmPassword: "weak" })).toThrow();
    expect(() => resetPasswordSchema.parse({ token: "x".repeat(32), password: "Strongpass1", confirmPassword: "Different1" })).toThrow(/Passwords do not match/);
  });

  it("accepts either a username or email at login", () => {
    expect(loginSchema.parse({ identifier: " USER_NAME ", password: "anything" }).identifier).toBe("user_name");
    expect(loginSchema.parse({ identifier: "USER@EXAMPLE.COM", password: "anything" }).identifier).toBe("user@example.com");
  });

  it("reserves protected super-admin usernames from public registration", () => {
    expect(isProtectedSuperAdminUsername(" BOATENBERG ")).toBe(true);
    expect(isProtectedSuperAdminUsername("ordinary-user")).toBe(false);
  });

  it("removes a domestic trunk zero from international phone numbers", () => {
    expect(removeLeadingTrunkZero("059 166 1816")).toBe("59 166 1816");
    expect(normalizeInternationalPhone("+233 059 166 1816")).toBe("+233591661816");
    expect(normalizeInternationalPhone("+225 07 12 34 56 78")).toBe("+2250712345678");
  });

  it("hashes passwords and rejects incorrect values", async () => {
    const hash = await hashPassword("Strongpass1");
    expect(hash).not.toContain("Strongpass1");
    await expect(verifyPassword("Strongpass1", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrongpass1", hash)).resolves.toBe(false);
    await expect(verifyPassword("Strongpass1", undefined)).resolves.toBe(false);
  });
});
