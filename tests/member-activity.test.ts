import { describe, expect, it } from "vitest";
import { describeAuditAction, describePaymentStatus } from "@/lib/member/activity";

describe("member activity descriptions", () => {
  it("turns known account actions into friendly member copy", () => {
    expect(describeAuditAction("USER_LOGGED_IN")).toMatchObject({ title: "Signed in", tone: "blue" });
    expect(describeAuditAction("PROFILE_UPDATED")).toMatchObject({ title: "Profile updated" });
  });

  it("provides readable fallback copy for future activity types", () => {
    expect(describeAuditAction("FAVOURITE_ADDED")).toMatchObject({ title: "Favourite added", tone: "slate" });
  });

  it("maps payment outcomes to clear statuses", () => {
    expect(describePaymentStatus("SUCCESS")).toEqual({ title: "Payment successful", tone: "emerald" });
    expect(describePaymentStatus("FAILED")).toEqual({ title: "Payment failed", tone: "slate" });
  });
});
