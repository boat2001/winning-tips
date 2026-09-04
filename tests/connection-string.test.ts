import { describe, expect, it } from "vitest";
import { normalizeDatabaseConnectionString } from "@/lib/db/connection-string";

describe("normalizeDatabaseConnectionString", () => {
  it.each(["prefer", "require", "verify-ca"])("makes %s certificate verification explicit", (sslMode) => {
    const result = normalizeDatabaseConnectionString(
      `postgresql://user:password@example.com:5432/database?sslmode=${sslMode}`,
    );

    expect(new URL(result).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("preserves explicit and absent SSL modes", () => {
    const explicit = normalizeDatabaseConnectionString(
      "postgresql://user:password@example.com/database?sslmode=disable",
    );
    const absent = normalizeDatabaseConnectionString(
      "postgresql://user:password@example.com/database?schema=public",
    );

    expect(new URL(explicit).searchParams.get("sslmode")).toBe("disable");
    expect(new URL(absent).searchParams.has("sslmode")).toBe(false);
  });
});
