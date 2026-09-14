import "server-only";
import { cache } from "react";
import { getDatabase } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminRoles } from "@/lib/auth/constants";
import { isDesignPreview } from "@/lib/config/countries";
import { toSportSlug } from "@/lib/domain/tips";
import type { PublishedTip, TipGrade } from "@/lib/domain/tips";
import type { Prisma } from "@prisma/client";

const include = { fixture: { include: { league: true, homeTeam: true, awayTeam: true } } } as const;
type Row = Prisma.PredictionGetPayload<{ include: typeof include }>;

/** Editorial confidence is not a model probability. Unverified odds are not live offers. */
function project(row: Row, unlocked: boolean, saved: boolean): PublishedTip {
  const locked = row.visibility === "PREMIUM" && !unlocked;
  const grade: TipGrade | null = row.result === "CANCELLED" ? "VOID" : row.result === "PENDING" ? null : row.result;
  return {
    id: row.id, slug: row.slug, sport: toSportSlug(row.fixture.league.sport), competition: row.fixture.league.name,
    home: { name: row.fixture.homeTeam.name }, away: { name: row.fixture.awayTeam.name },
    kickoffAt: row.fixture.kickoffAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    market: locked ? "Premium prediction" : row.market, selection: locked ? "Unlock this slip to view" : row.selection,
    modelProbability: null, confidenceBand: null, dataQuality: null, modelVersion: null, odds: null,
    status: grade ? "GRADED" : ["POSTPONED", "CANCELLED"].includes(row.fixture.status) ? "SUSPENDED" : "PUBLISHED",
    grade, finalScore: row.fixture.homeScore !== null && row.fixture.awayScore !== null ? `${row.fixture.homeScore} - ${row.fixture.awayScore}` : null,
    premium: row.visibility === "PREMIUM", locked, savedByViewer: saved, summary: locked ? null : row.analysis,
  };
}

export const getTipsData = cache(async () => {
  if (isDesignPreview()) {
    const { allFixtureTips } = await import("@/lib/fixtures/tips.fixture");
    const { recentGradedTips } = await import("@/lib/fixtures/performance.fixture");
    const graded: PublishedTip[] = recentGradedTips.map(r => ({
      id:r.id,slug:r.slug,sport:r.sport,competition:r.competition,home:{name:r.fixture.split(" vs ")[0]},away:{name:r.fixture.split(" vs ")[1] ?? "Opponent"},
      kickoffAt:r.settledAt,market:r.market,selection:r.market,modelProbability:null,confidenceBand:null,dataQuality:null,odds:null,status:"GRADED",grade:r.grade,finalScore:r.finalScore,premium:false,savedByViewer:false,summary:null
    }));
    const previewTips = allFixtureTips.map(tip => ({
      ...tip,
      odds: tip.odds ? { ...tip.odds, capturedAt: new Date().toISOString() } : null,
    }));
    return { tips: [...previewTips,...graded], unavailable:false };
  }
  try {
    const user = await getCurrentUser();
    const db = getDatabase();
    const [rows, purchases, saved] = await Promise.all([
      db.prediction.findMany({
        // Mock-provider fixtures are demo data and are excluded in every
        // environment, without exception (guide §21.8). Local work that needs a
        // populated UI uses DESIGN_PREVIEW, which never touches the database.
        where: { status: "PUBLISHED", OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }], AND: [{ OR: [{ bookingId: null }, { booking: { deletedAt: null } }] }], fixture: { provider: { not: "mock" } } },
        include, orderBy: [{ fixture: { kickoffAt: "desc" } }, { id: "asc" }],
      }),
      user ? db.payment.findMany({ where: { userId: user.id, status: "SUCCESS", bookingId: { not: null } }, select: { bookingId: true } }) : [],
      user ? db.savedTip.findMany({ where: { userId: user.id }, select: { predictionId: true } }) : [],
    ]);
    const purchased = new Set(purchases.map(p => p.bookingId));
    const savedIds = new Set(saved.map(s => s.predictionId));
    const admin = user && adminRoles.some(role => role === user.role);
    return { tips: rows.map(row => project(row, Boolean(admin || (row.bookingId && purchased.has(row.bookingId))), savedIds.has(row.id))), unavailable: false };
  } catch {
    return { tips: [] as PublishedTip[], unavailable: true };
  }
});

export async function getTip(slug: string) {
  const data = await getTipsData();
  return { tip: data.tips.find(t => t.slug === slug), unavailable: data.unavailable };
}
