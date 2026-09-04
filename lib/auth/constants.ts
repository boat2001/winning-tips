export const sessionCookieName = "smarttips_session";
export const sessionDurationMilliseconds = 30 * 24 * 60 * 60 * 1000;
export const adminRoles = ["SUPER_ADMIN", "ADMIN", "EDITOR", "TIPSTER"] as const;

export type AdminRole = (typeof adminRoles)[number];
