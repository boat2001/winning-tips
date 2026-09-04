const legacyStrictSslModes = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseConnectionString(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();

  if (sslMode && legacyStrictSslModes.has(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
