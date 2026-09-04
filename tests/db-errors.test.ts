import { describe, expect, it, vi } from "vitest";
import { isTransientDatabaseError, retryTransientDatabaseRead } from "@/lib/db/errors";

describe("database error resilience", () => {
  it.each(["P1001", "P1002", "P1017"])("recognizes Prisma error %s as transient", (code) => {
    expect(isTransientDatabaseError({ code })).toBe(true);
  });

  it("recognizes the database reachability message", () => {
    expect(isTransientDatabaseError(new Error("Can't reach database server at db.prisma.io"))).toBe(true);
  });

  it("does not hide application and query errors", () => {
    expect(isTransientDatabaseError({ code: "P2025", message: "Record not found" })).toBe(false);
  });

  it("retries one transient read failure", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce({ code: "P1001" })
      .mockResolvedValueOnce("connected");

    await expect(retryTransientDatabaseRead(operation, { delayMilliseconds: 0 })).resolves.toBe("connected");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient failure", async () => {
    const error = { code: "P2025" };
    const operation = vi.fn().mockRejectedValue(error);

    await expect(retryTransientDatabaseRead(operation, { delayMilliseconds: 0 })).rejects.toBe(error);
    expect(operation).toHaveBeenCalledOnce();
  });
});
