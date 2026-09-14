import { afterEach, describe, expect, it, vi } from "vitest";
import { passwordEmailConfigured, sendPasswordResetEmail } from "@/lib/messaging/password-email";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("password recovery delivery", () => {
  it("does not pretend recovery is configured without a sender", () => {
    vi.stubEnv("RESEND_API_KEY", ""); vi.stubEnv("EMAIL_FROM", ""); expect(passwordEmailConfigured()).toBe(false);
  });
  it("sends the single-use link using the configured application origin", async () => {
    vi.stubEnv("RESEND_API_KEY", "test"); vi.stubEnv("EMAIL_FROM", "Winning Tips <support@example.com>"); vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://winning-tips.org");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ id: "sent" })); vi.stubGlobal("fetch", fetcher);
    await sendPasswordResetEmail("buyer@example.com", "one-time-token");
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.to).toEqual(["buyer@example.com"]); expect(payload.text).toContain("https://winning-tips.org/reset-password?token=one-time-token");
  });
  it("surfaces provider failure without echoing private response data", async () => {
    vi.stubEnv("RESEND_API_KEY", "test"); vi.stubEnv("EMAIL_FROM", "support@example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider response", { status: 503 })));
    await expect(sendPasswordResetEmail("buyer@example.com", "token")).rejects.toThrow("could not be delivered");
  });
});
