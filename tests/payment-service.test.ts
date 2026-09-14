import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), current: vi.fn(), update: vi.fn(), lock: vi.fn(), verify: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ getDatabase: () => ({
  payment: { findUnique: mocks.find },
  $transaction: (fn: (tx: unknown) => unknown) => fn({ $queryRaw: mocks.lock, payment: { findUniqueOrThrow: mocks.current, update: mocks.update } }),
}) }));
vi.mock("@/lib/payments/paystack", () => ({ PaystackProvider: class { verify = mocks.verify; } }));
import { markPaymentRefunded, verifyAndFulfilPayment } from "@/lib/payments/service";

const reference = "td_launch_0123456789abcdef01";
const payment = { id: "p1", userId: "u1", reference, status: "PENDING", amountMinor: 4000, currency: "GHS", user: { email: "buyer@example.com" } };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue(payment);
  mocks.current.mockResolvedValue(payment);
  mocks.update.mockImplementation(async ({ data }) => ({ ...payment, ...data }));
  mocks.verify.mockResolvedValue({ reference, status: "success", amountMinor: 4000, currency: "GHS", customerEmail: "buyer@example.com", providerReference: "1", raw: {}, paidAt: null });
});

describe("payment callbacks and refund ordering", () => {
  it("unlocks an exactly verified payment under a row lock", async () => {
    expect((await verifyAndFulfilPayment(reference)).status).toBe("success");
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SUCCESS" }) }));
  });
  it("does not resurrect a refunded payment on a repeated success callback", async () => {
    mocks.find.mockResolvedValue({ ...payment, status: "REFUNDED" });
    expect((await verifyAndFulfilPayment(reference)).status).toBe("refunded");
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("respects a refund committed while provider verification was in flight", async () => {
    mocks.current.mockResolvedValue({ ...payment, status: "REFUNDED" });
    expect((await verifyAndFulfilPayment(reference)).status).toBe("refunded");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not downgrade success when a stale failed verification finishes later", async () => {
    mocks.verify.mockResolvedValue({ status: "failed" });
    mocks.current.mockResolvedValue({ ...payment, status: "SUCCESS" });
    expect((await verifyAndFulfilPayment(reference)).status).toBe("success");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("refuses a successful gateway payment with the wrong amount", async () => {
    const result = await mocks.verify();
    mocks.verify.mockResolvedValue({ ...result, amountMinor: 1 });
    expect((await verifyAndFulfilPayment(reference)).status).toBe("failed");
  });
  it("serializes refunds with callback writers", async () => {
    expect(await markPaymentRefunded(reference)).toBe(true);
    expect(mocks.lock).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { status: "REFUNDED", verifiedAt: expect.any(Date) } });
  });
});
