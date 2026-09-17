import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { automationPausedKey, isAutomationPaused, readPausedValue, setAutomationPaused } from "../lib/automation/controls";

function stubDatabase(overrides: { findUnique?: unknown; upsert?: unknown }) {
  return { setting: { findUnique: overrides.findUnique, upsert: overrides.upsert } } as unknown as PrismaClient;
}

describe("automation pause switch", () => {
  it("reads both a JSON boolean and a hand-edited string", () => {
    expect(readPausedValue(true)).toBe(true);
    expect(readPausedValue("true")).toBe(true);
    expect(readPausedValue(false)).toBe(false);
    expect(readPausedValue("no")).toBe(false);
    expect(readPausedValue(null)).toBe(false);
  });

  it("is not paused when the setting has never been written", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    await expect(isAutomationPaused(stubDatabase({ findUnique }))).resolves.toBe(false);
    expect(findUnique).toHaveBeenCalledWith({ where: { key: automationPausedKey }, select: { value: true } });
  });

  it("reports the stored value", async () => {
    const database = stubDatabase({ findUnique: vi.fn().mockResolvedValue({ value: true }) });
    await expect(isAutomationPaused(database)).resolves.toBe(true);
  });

  // A database outage must not silently stop the nightly publish and settle.
  it("treats an unreachable database as not paused", async () => {
    const database = stubDatabase({ findUnique: vi.fn().mockRejectedValue(new Error("connection refused")) });
    await expect(isAutomationPaused(database)).resolves.toBe(false);
  });

  it("writes the switch with its group and description", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    await setAutomationPaused(true, stubDatabase({ upsert }));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: automationPausedKey },
      update: { value: true },
      create: expect.objectContaining({ key: automationPausedKey, value: true, group: "automation", isPublic: false }),
    }));
  });
});
