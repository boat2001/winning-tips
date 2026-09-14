import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db/client";
import { getFixtureDateWindows, getUtcDayRange } from "@/lib/football/dates";
import { requireUser } from "@/lib/auth/authorization";
import { isDesignPreview, resolveMemberCountry } from "@/lib/config/countries";
import { getMemberCountryCode } from "@/lib/app/preferences";
import type { Viewer } from "@/lib/domain/viewer";

export async function requireMember(destination: string) {
  if (isDesignPreview()) return null;
  return requireUser(destination);
}

/**
 * Premium is not a stored date. A member is premium for exactly as long as they
 * hold a card for today, which is what a one-time daily purchase means.
 */
async function ownsCardToday(userId: string): Promise<boolean> {
  try {
    const { start, end } = getUtcDayRange(getFixtureDateWindows()[1].date);
    const owned = await getDatabase().payment.count({
      where: { userId, status: "SUCCESS", booking: { bookingDate: { gte: start, lt: end } } },
    });
    return owned > 0;
  } catch {
    return false;
  }
}

export async function getCurrentViewer(): Promise<Viewer> {
  if (isDesignPreview()) return (await import("@/lib/fixtures/viewer.fixture")).fixtureViewer;
  const user = await getCurrentUser();
  const [premium, chosenCountry] = user ? await Promise.all([ownsCardToday(user.id), getMemberCountryCode(user.id)]) : [false, null];
  const country = resolveMemberCountry(chosenCountry);
  return {
    id: user?.id ?? "guest", displayName: user?.displayName ?? user?.username ?? "Guest",
    handle: user?.username ?? "guest", avatarUrl: null,
    plan: premium ? "PREMIUM" : "FREE",
    countryCode: country.countryCode, countryName: country.name, timezone: country.timezone,
    location: null, tagline: null, unreadNotifications: 0,
  };
}
