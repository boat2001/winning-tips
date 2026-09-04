import { isIP } from "node:net";
import { headers } from "next/headers";

export async function getRequestMetadata() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip")?.trim() ?? null;
  return {
    ipAddress: forwarded && isIP(forwarded) ? forwarded : null,
    userAgent: headerStore.get("user-agent")?.slice(0, 500) ?? null,
  };
}
