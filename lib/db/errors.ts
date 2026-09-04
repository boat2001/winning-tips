const transientDatabaseErrorCodes = new Set(["P1001", "P1002", "P1017"]);

type DatabaseError = { code?: unknown; message?: unknown; constructor?: { name?: string } };

export function isTransientDatabaseError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const candidate = error as DatabaseError;
  if (typeof candidate.code === "string" && transientDatabaseErrorCodes.has(candidate.code)) {
    return true;
  }

  return typeof candidate.message === "string"
    && /can't reach database server|server has closed the connection|connection[^\n]*timed out/i.test(candidate.message);
}

export async function retryTransientDatabaseRead<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMilliseconds?: number } = {},
) {
  const attempts = Math.max(1, options.attempts ?? 2);
  const delayMilliseconds = Math.max(0, options.delayMilliseconds ?? 150);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDatabaseError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMilliseconds * attempt));
    }
  }

  throw new Error("Database read retry ended unexpectedly.");
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  if (!error || typeof error !== "object") return false;

  const candidate = error as DatabaseError;
  return (
    (typeof candidate.code === "string" && /^P\d{4}$/.test(candidate.code)) ||
    candidate.constructor?.name?.startsWith("PrismaClient") === true
  );
}

export function isUniqueConstraintError(error: unknown) {
  return isDatabaseError(error) && error.code === "P2002";
}
