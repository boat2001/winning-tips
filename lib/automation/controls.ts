import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getDatabase } from "@/lib/db/client";

/**
 * The switch that holds the nightly automation.
 *
 * Kept in the settings table rather than an environment variable so an admin can
 * stop tonight's publishing and digest from the panel, without a redeploy, and
 * so the change is visible to everyone who can see settings.
 */
export const automationPausedKey = "automation.paused";

/** Stored as JSON, so a hand-edited "true" counts the same as a boolean. */
export function readPausedValue(value: unknown): boolean {
  return value === true || value === "true";
}

/**
 * Whether automation is paused. A database that cannot answer is treated as not
 * paused: the nightly run failing closed would silently stop publishing and
 * settling, which is worse than running.
 */
export async function isAutomationPaused(database: PrismaClient = getDatabase()): Promise<boolean> {
  try {
    const row = await database.setting.findUnique({ where: { key: automationPausedKey }, select: { value: true } });
    return row ? readPausedValue(row.value) : false;
  } catch {
    return false;
  }
}

export async function setAutomationPaused(paused: boolean, database: PrismaClient = getDatabase()): Promise<void> {
  await database.setting.upsert({
    where: { key: automationPausedKey },
    update: { value: paused },
    create: {
      key: automationPausedKey,
      value: paused,
      group: "automation",
      description: "Holds the nightly publish, settle and digest jobs.",
      isPublic: false,
    },
  });
}
