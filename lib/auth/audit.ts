import type { JsonObject } from "@/lib/football/types";
import { getDatabase } from "@/lib/db/client";
import { getRequestMetadata } from "@/lib/auth/request";

export async function recordAudit(input: { actorId?: string | null; action: string; entityType: string; entityId?: string | null; metadata?: JsonObject }) {
  const request = await getRequestMetadata();
  await getDatabase().auditLog.create({ data: { ...input, ...request } });
}
