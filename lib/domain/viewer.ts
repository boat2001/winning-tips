/**
 * The signed-in member as the app shell and profile screen need them.
 *
 * Deliberately narrower than the database user: the shell needs a name, an
 * avatar and a plan badge, and nothing else should travel to the client.
 */

export type MembershipPlan = "FREE" | "PREMIUM";

export interface Viewer {
  readonly id: string;
  readonly displayName: string;
  /** Community handle, shown on the profile screen and on posts. */
  readonly handle: string;
  readonly avatarUrl: string | null;
  readonly plan: MembershipPlan;
  /** ISO 3166-1 alpha-2. Drives currency, operators and legal copy (§3). */
  readonly countryCode: string;
  readonly countryName: string;
  readonly timezone: string;
  readonly location: string | null;
  readonly tagline: string | null;
  readonly unreadNotifications: number;
  /**
   * Shows the Admin panel link. Only a hint for the UI: every /admin route
   * checks the role again on the server.
   */
  readonly canAccessAdmin: boolean;
}

const PLAN_LABEL: Record<MembershipPlan, string> = {
  FREE: "Free member",
  PREMIUM: "Pro Member",
};

export function planLabel(plan: MembershipPlan): string {
  return PLAN_LABEL[plan];
}

/**
 * Initials for the avatar fallback. Takes the first letter of the first and
 * last word, so "Alex Carter" gives AC and a single-word name gives one letter.
 */
export function initialsOf(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]![0]!;
  const last = words.length > 1 ? words[words.length - 1]![0]! : "";
  return (first + last).toUpperCase();
}

/**
 * The greeting the home hero opens with.
 *
 * Bounded to the member's own timezone rather than the server's — a Ghanaian
 * member opening the app at 07:00 Accra must not be told good evening because
 * the render happened in a US region.
 */
export function greetingFor(timezone: string, now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: timezone }).format(now),
  );
  if (hour < 12) return "Good Morning!";
  if (hour < 17) return "Good Afternoon!";
  return "Good Evening!";
}
