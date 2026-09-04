import "server-only";

const fallbackProtectedUsernames = ["boatenberg"];

export function isProtectedSuperAdminUsername(username: string) {
  const configured = process.env.PROTECTED_SUPER_ADMIN_USERNAMES;
  const protectedUsernames = configured === undefined
    ? fallbackProtectedUsernames
    : configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return protectedUsernames.includes(username.trim().toLowerCase());
}
