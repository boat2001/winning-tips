import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { normalizeDatabaseConnectionString } from "../lib/db/connection-string";
import { getFixtureDateWindows } from "../lib/football/dates";
import { MockFootballProvider } from "../lib/football/mock-provider";
import { siteConfig } from "../lib/config/site";
import { createPrismaFixtureRepository } from "../lib/football/repository";
import { syncFixturesForDates } from "../lib/football/sync";

// Keep direct seed execution consistent with Next.js and prisma.config.ts.
config({ path: [".env.local", ".env"] });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({
  connectionString: normalizeDatabaseConnectionString(connectionString),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminUsername = process.env.SEED_ADMIN_USERNAME?.trim().toLowerCase() || "smarttips-admin";
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 8) throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    // displayName is set on update as well as create: a database seeded under
    // the old brand otherwise keeps its name forever, the same way site.identity
    // did.
    const adminDisplayName = `${siteConfig.name} Admin`;
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, role: "SUPER_ADMIN", isActive: true, displayName: adminDisplayName },
      create: { email: adminEmail, username: adminUsername, displayName: adminDisplayName, passwordHash, role: "SUPER_ADMIN", emailVerifiedAt: new Date() },
    });
  }

  // Sourced from siteConfig rather than repeated here, and written on update as
  // well as create, so a re-seed heals brand drift instead of preserving it.
  const identity = { name: siteConfig.name, tagline: siteConfig.tagline };
  await prisma.setting.upsert({
    where: { key: "site.identity" },
    update: { value: identity },
    create: {
      key: "site.identity",
      value: identity,
      description: "Public brand identity defaults.",
      group: "brand",
      isPublic: true,
    },
  });

  // Demo content is opt-in. Decks, plans and settings below are configuration
  // the app cannot work without - four call sites map SportyBet categories onto
  // the deck slugs - but mock fixtures and sample predictions must never land in
  // a real database, so they only run with SEED_DEMO_DATA=true.
  const seedDemoData = process.env.SEED_DEMO_DATA === "true";

  const windows = getFixtureDateWindows();

  if (seedDemoData) {
    await syncFixturesForDates(
      new MockFootballProvider(),
      windows.map((window) => window.date),
      createPrismaFixtureRepository(prisma),
    );
  }

  const freeDeck = await prisma.deck.upsert({
    where: { slug: "free-deck" },
    update: {},
    create: {
      name: "Free Deck",
      slug: "free-deck",
      description: "A daily selection available to every Smart Tips visitor.",
      icon: "FD",
      visualIdentifier: "lime",
      sortOrder: 1,
    },
  });

  const vipDeck = await prisma.deck.upsert({
    where: { slug: "vip-deck" },
    update: {
      name: "VIP 1 Deck",
      description: "Daily premium selections for the VIP 1 package.",
      icon: "V1",
      isPremium: true,
      sortOrder: 2,
    },
    create: {
      name: "VIP 1 Deck",
      slug: "vip-deck",
      description: "Daily premium selections for the VIP 1 package.",
      icon: "V1",
      visualIdentifier: "emerald",
      isPremium: true,
      sortOrder: 2,
    },
  });

  const vipTwoDeck = await prisma.deck.upsert({
    where: { slug: "vip-2-deck" },
    update: { name: "VIP 2 Deck", description: "Higher-value daily selections for the VIP 2 package.", icon: "V2", isPremium: true, sortOrder: 3 },
    create: { name: "VIP 2 Deck", slug: "vip-2-deck", description: "Higher-value daily selections for the VIP 2 package.", icon: "V2", visualIdentifier: "amber", isPremium: true, sortOrder: 3 },
  });

  const vipThreeDeck = await prisma.deck.upsert({
    where: { slug: "vip-3-deck" },
    update: { name: "VIP 3 Deck", description: "Top-tier daily selections for the VIP 3 package.", icon: "V3", isPremium: true, sortOrder: 4 },
    create: { name: "VIP 3 Deck", slug: "vip-3-deck", description: "Top-tier daily selections for the VIP 3 package.", icon: "V3", visualIdentifier: "navy", isPremium: true, sortOrder: 4 },
  });

  await prisma.plan.upsert({
    where: { slug: "vip-day-pass" },
    update: { name: "VIP 1", description: "Access to carefully selected VIP 1 sports predictions.", currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipDeck.id, sortOrder: 1 },
    create: { name: "VIP 1", slug: "vip-day-pass", description: "Access to carefully selected VIP 1 sports predictions.", priceMinor: 0, currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipDeck.id, sortOrder: 1 },
  });
  await prisma.plan.upsert({
    where: { slug: "vip-weekly" },
    update: { name: "VIP 2", description: "Access to higher-value VIP 2 sports predictions.", currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipTwoDeck.id, sortOrder: 2 },
    create: { name: "VIP 2", slug: "vip-weekly", description: "Access to higher-value VIP 2 sports predictions.", priceMinor: 0, currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipTwoDeck.id, sortOrder: 2 },
  });
  await prisma.plan.upsert({
    where: { slug: "vip-monthly" },
    update: { name: "VIP 3", description: "Access to our top-tier VIP 3 sports predictions.", currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipThreeDeck.id, sortOrder: 3 },
    create: { name: "VIP 3", slug: "vip-monthly", description: "Access to our top-tier VIP 3 sports predictions.", priceMinor: 0, currency: "GHS", durationDays: 1, scope: "DECK", deckId: vipThreeDeck.id, sortOrder: 3 },
  });

  if (!seedDemoData) {
    const admin = adminEmail && adminPassword ? "1 super-admin" : "no accounts";
    console.log(`Seeded configuration only: 4 decks, 3 VIP plans, brand settings, ${admin}. No fixtures, predictions or slips.`);
    return;
  }

  const todayFixtures = await prisma.fixture.findMany({
    where: {
      kickoffAt: { gte: windows[1].start, lt: windows[1].end },
    },
    orderBy: { kickoffAt: "asc" },
  });
  const yesterdayFixtures = await prisma.fixture.findMany({
    where: {
      kickoffAt: { gte: windows[0].start, lt: windows[0].end },
    },
    orderBy: { kickoffAt: "asc" },
  });

  const samples = [
    { fixture: todayFixtures[0], deck: freeDeck, market: "Total Goals", selection: "Over 1.5 Goals", odds: "1.42", confidence: 78, visibility: "FREE" as const, result: "PENDING" as const },
    { fixture: todayFixtures[1], deck: vipDeck, market: "Both Teams to Score", selection: "Yes", odds: "1.73", confidence: 74, visibility: "PREMIUM" as const, result: "PENDING" as const },
    { fixture: todayFixtures[2], deck: freeDeck, market: "Match Result", selection: "Home Win", odds: "1.58", confidence: 72, visibility: "FREE" as const, result: "PENDING" as const },
    { fixture: yesterdayFixtures[0], deck: freeDeck, market: "Total Goals", selection: "Over 1.5 Goals", odds: "1.42", confidence: 78, visibility: "FREE" as const, result: "WON" as const },
    { fixture: yesterdayFixtures[1], deck: vipDeck, market: "Both Teams to Score", selection: "Yes", odds: "1.73", confidence: 74, visibility: "PREMIUM" as const, result: "WON" as const },
  ];

  for (const sample of samples) {
    if (!sample.fixture) continue;
    const slug = `${sample.fixture.externalId}-${sample.market.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    await prisma.prediction.upsert({
      where: { slug },
      update: { result: sample.result },
      create: {
        slug,
        fixtureId: sample.fixture.id,
        deckId: sample.deck.id,
        market: sample.market,
        selection: sample.selection,
        odds: sample.odds,
        confidence: sample.confidence,
        analysis: "This selection is based on the fixture profile, recent attacking output and the balance of risk at the available market price.",
        visibility: sample.visibility,
        status: "PUBLISHED",
        result: sample.result,
        publishAt: new Date(),
        createdById: "system-admin",
      },
    });
  }

  const demoSlips = [
    {
      code: "DEMOFREE01",
      title: "Free Predictions",
      category: "FREE" as const,
      deck: freeDeck,
      bookingDate: windows[1].start,
      fixtures: todayFixtures.slice(0, 3),
      odds: ["1.42", "1.65", "1.58"],
      results: ["PENDING", "PENDING", "PENDING"] as const,
      priceMinor: null,
    },
    {
      code: "DEMOVIP101",
      title: "VIP 1 Predictions",
      category: "VIP1" as const,
      deck: vipDeck,
      bookingDate: windows[1].start,
      fixtures: todayFixtures.slice(1, 4),
      odds: ["1.73", "1.54", "1.80"],
      results: ["PENDING", "PENDING", "PENDING"] as const,
      priceMinor: 5000,
    },
    {
      code: "DEMOVIP201",
      title: "VIP 2 Predictions",
      category: "VIP2" as const,
      deck: vipTwoDeck,
      bookingDate: windows[1].start,
      fixtures: todayFixtures.slice(0, 4),
      odds: ["1.82", "1.60", "1.71", "1.55"],
      results: ["PENDING", "PENDING", "PENDING", "PENDING"] as const,
      priceMinor: 8000,
    },
    {
      code: "DEMOVIP301",
      title: "VIP 3 Predictions",
      category: "VIP3" as const,
      deck: vipThreeDeck,
      bookingDate: windows[1].start,
      fixtures: todayFixtures.slice(0, 4),
      odds: ["1.95", "1.78", "1.66", "1.84"],
      results: ["PENDING", "PENDING", "PENDING", "PENDING"] as const,
      priceMinor: 12000,
    },
    {
      code: "DEMOFREE00",
      title: "Free Predictions",
      category: "FREE" as const,
      deck: freeDeck,
      bookingDate: windows[0].start,
      fixtures: yesterdayFixtures.slice(0, 3),
      odds: ["1.40", "1.68", "1.52"],
      results: ["WON", "LOST", "WON"] as const,
      priceMinor: null,
    },
    {
      code: "DEMOVIP100",
      title: "VIP 1 Predictions",
      category: "VIP1" as const,
      deck: vipDeck,
      bookingDate: windows[0].start,
      fixtures: yesterdayFixtures.slice(1, 4),
      odds: ["1.71", "1.62", "1.88"],
      results: ["WON", "WON", "CANCELLED"] as const,
      priceMinor: 5000,
    },
    {
      code: "DEMOVIP200",
      title: "VIP 2 Predictions",
      category: "VIP2" as const,
      deck: vipTwoDeck,
      bookingDate: windows[0].start,
      fixtures: yesterdayFixtures.slice(0, 4),
      odds: ["1.76", "1.63", "1.70", "1.91"],
      results: ["LOST", "WON", "LOST", "WON"] as const,
      priceMinor: 8000,
    },
  ];

  const markets = ["Total Goals", "Both Teams to Score", "Match Result", "Double Chance"];
  const selections = ["Over 1.5 Goals", "Yes", "Home Win", "Home or Draw"];

  for (const [slipIndex, slip] of demoSlips.entries()) {
    if (!slip.fixtures.length) continue;
    const totalOdds = slip.odds.reduce((total, odd) => total * Number(odd), 1).toFixed(2);
    const booking = await prisma.booking.upsert({
      where: { code: slip.code },
      update: {
        title: slip.title,
        category: slip.category,
        totalOdds,
        priceMinor: slip.priceMinor,
        bookingDate: slip.bookingDate,
        isActive: true,
        sortOrder: slipIndex,
      },
      create: {
        title: slip.title,
        platform: "SportyBet",
        code: slip.code,
        category: slip.category,
        totalOdds,
        priceMinor: slip.priceMinor,
        deadline: slip.fixtures[0]?.kickoffAt,
        bookingDate: slip.bookingDate,
        isActive: true,
        sortOrder: slipIndex,
      },
    });

    for (const [index, fixture] of slip.fixtures.entries()) {
      const slug = `demo-${slip.code.toLowerCase()}-${index + 1}`;
      await prisma.prediction.upsert({
        where: { slug },
        update: {
          fixtureId: fixture.id,
          deckId: slip.deck.id,
          bookingId: booking.id,
          market: markets[index % markets.length],
          selection: selections[index % selections.length],
          odds: slip.odds[index] ?? "1.50",
          visibility: slip.category === "FREE" ? "FREE" : "PREMIUM",
          status: "PUBLISHED",
          result: slip.results[index] ?? "PENDING",
        },
        create: {
          slug,
          fixtureId: fixture.id,
          deckId: slip.deck.id,
          bookingId: booking.id,
          market: markets[index % markets.length],
          selection: selections[index % selections.length],
          odds: slip.odds[index] ?? "1.50",
          confidence: 72 + index * 3,
          analysis: "Demo selection for reviewing the Smart Tips games-management and prediction interfaces.",
          visibility: slip.category === "FREE" ? "FREE" : "PREMIUM",
          status: "PUBLISHED",
          result: slip.results[index] ?? "PENDING",
          publishAt: new Date(),
          createdById: "system-admin",
        },
      });
    }
  }

  console.log(`Seeded ${demoSlips.length} demo slips for Games Management.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
