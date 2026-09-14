import "server-only";
import { getDatabase } from "@/lib/db/client";
import { isDesignPreview } from "@/lib/config/countries";
/** The edition a member chose, or null when none is stored or it cannot be read. */
export async function getMemberCountryCode(userId: string): Promise<string | null> {
  if (isDesignPreview()) return null;
  try {
    const preference = await getDatabase().userPreference.findUnique({ where: { userId }, select: { countryCode: true } });
    return preference?.countryCode ?? null;
  } catch {
    return null;
  }
}

export async function getPreferences(userId: string) {
  const fallback = { countryCode: "GH", sports: [] as string[], notifications: false };
  if (isDesignPreview()) return { ...fallback, available: false };
  try { return { ...fallback, ...await getDatabase().userPreference.findUnique({where:{userId}}), available: true }; }
  catch { return { ...fallback, available: false }; }
}
