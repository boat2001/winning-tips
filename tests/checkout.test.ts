import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), plan: vi.fn(), card: vi.fn(), owned: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), initialize: vi.fn(), audit: vi.fn(), existing: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ requireUser: m.user }));
vi.mock("@/lib/auth/audit", () => ({ recordAudit: m.audit }));
vi.mock("@/lib/app/preferences", () => ({ getMemberCountryCode: async () => "GH" }));
vi.mock("@/lib/payments/paystack", () => ({ PaystackProvider: class { initialize = m.initialize; } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/lib/db/client", () => ({ getDatabase: () => ({ plan: { findFirst: m.plan }, booking: { findFirst: m.card }, payment: { findFirst: m.owned, count: m.count, update: m.update }, $transaction: (fn: (tx: unknown) => unknown) => fn({ $queryRaw: vi.fn(), payment: { findFirst: m.existing, create: m.create } }) }) }));
import { initializeCheckoutAction } from "@/app/(public)/vip/actions";
const future = new Date(Date.now() + 86_400_000);
const card = { id: "card", priceMinor: 4000, currency: "GHS", isSoldOut: false, deadline: future, predictions: [{ result: "PENDING", fixture: { kickoffAt: future, provider: "sportybet" } }] };
function form() { const f = new FormData(); f.set("planId", "plan"); f.set("bookingId", "card"); f.set("priceMinor", "4000"); return f; }
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_example");
  m.user.mockResolvedValue({ id: "user", email: "buyer@example.com" });
  m.plan.mockResolvedValue({ id: "plan", deck: { slug: "vip-deck" } }); m.card.mockResolvedValue(card);
  m.owned.mockResolvedValue(null); m.existing.mockResolvedValue(null); m.count.mockResolvedValue(0); m.create.mockResolvedValue({ id: "payment" });
  m.initialize.mockResolvedValue({ authorizationUrl: "https://checkout.paystack.com/example", accessCode: "test" });
});
describe("VIP checkout boundaries", () => {
  it("creates the exact server-priced card order", async () => {
    await expect(initializeCheckoutAction({}, form())).rejects.toThrow("REDIRECT:https://checkout.paystack.com/");
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ bookingId: "card", amountMinor: 4000, currency: "GHS", userId: "user" }) });
  });
  it.each([
    ["expired", { deadline: new Date(0) }],
    ["missing deadline", { deadline: null }],
    ["closed", { isSoldOut: true }],
    ["unpublished", { predictions: [] }],
    ["started", { predictions: [{ result: "PENDING", fixture: { kickoffAt: new Date(0), provider: "sportybet" } }] }],
    ["demo", { predictions: [{ result: "PENDING", fixture: { kickoffAt: future, provider: "mock" } }] }],
  ])("refuses a %s card before contacting the gateway", async (_name, patch) => {
    m.card.mockResolvedValue({ ...card, ...patch }); expect((await initializeCheckoutAction({}, form())).error).toBeTruthy(); expect(m.initialize).not.toHaveBeenCalled();
  });
  it("refuses changed quotes and previously purchased cards", async () => {
    const f = form(); f.set("priceMinor", "5000"); expect((await initializeCheckoutAction({}, f)).error).toContain("changed");
    m.owned.mockResolvedValue({ id: "paid" }); expect((await initializeCheckoutAction({}, form())).error).toContain("already own"); expect(m.create).not.toHaveBeenCalled();
  });
  it("does not start a second concurrent checkout for the same card", async () => {
    m.existing.mockResolvedValue({ status: "PENDING" }); expect((await initializeCheckoutAction({}, form())).error).toContain("already pending"); expect(m.initialize).not.toHaveBeenCalled();
  });
  it("disables payment when no key exists", async () => {
    vi.stubEnv("PAYSTACK_SECRET_KEY", ""); expect((await initializeCheckoutAction({}, form())).error).toContain("not configured"); expect(m.create).not.toHaveBeenCalled();
  });
});
