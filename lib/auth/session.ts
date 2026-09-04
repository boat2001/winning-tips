import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDatabase } from "@/lib/db/client";
import { isTransientDatabaseError, retryTransientDatabaseRead } from "@/lib/db/errors";
import { sessionCookieName, sessionDurationMilliseconds } from "@/lib/auth/constants";
import { getRequestMetadata } from "@/lib/auth/request";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMilliseconds);
  const request = await getRequestMetadata();

  await getDatabase().session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ...request },
  });

  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    await getDatabase().session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(sessionCookieName);
}

export async function revokeAllUserSessions(userId: string) {
  await getDatabase().session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  let session;
  try {
    session = await retryTransientDatabaseRead(() => getDatabase().session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            phone: true,
            role: true,
            emailVerifiedAt: true,
            premiumAccessUntil: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    }));
  } catch (error) {
    // Authentication must fail closed during a brief database outage. Returning
    // null keeps public pages available without granting any user privileges.
    if (isTransientDatabaseError(error)) return null;
    throw error;
  }

  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;
  return session.user;
});
