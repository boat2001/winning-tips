import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getFixtureDateWindows, getUpcomingDateKeys } from "@/lib/football/dates";
import { getFootballProvider } from "@/lib/football/mock-provider";
import { syncFixturesForDates } from "@/lib/football/sync";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const suppliedSecret =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";

  if (!configuredSecret || !suppliedSecret) return false;

  const configured = Buffer.from(configuredSecret);
  const supplied = Buffer.from(suppliedSecret);
  return configured.length === supplied.length && timingSafeEqual(configured, supplied);
}

async function handleSync(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Fixture sync is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedDays = Number(url.searchParams.get("days") ?? "3");
  const days = Number.isInteger(requestedDays) ? Math.min(7, Math.max(1, requestedDays)) : 3;

  try {
    const yesterday = getFixtureDateWindows()[0].date;
    const dates = [yesterday, ...getUpcomingDateKeys(days)];
    const summary = await syncFixturesForDates(getFootballProvider(), dates);

    return NextResponse.json({ ok: true, provider: "mock", ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fixture sync failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = handleSync;
export const POST = handleSync;
