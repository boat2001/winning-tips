# Winning Tips Africa — Product, Design, and Development Guide

**Document status:** Foundational implementation specification  
**Initial launch market:** Ghana  
**Second market:** Nigeria  
**Long-term scope:** Country-by-country African platform  
**Primary implementer:** Claude Code and human engineering team  

---

## 1. Purpose and authority

This document is the single development guide for Winning Tips. It consolidates the product model, Africa-first architecture, launch sequence, payments, bookmaker handoff, prediction automation, visual system, screen layouts, responsive behavior, asset conventions, and implementation rules.

When requirements conflict, use this order of authority:

1. The latest explicit product-owner instruction.
2. The supplied mock for the exact screen and viewport family.
3. This guide.
4. Existing design tokens and reusable components.
5. Engineering judgment for details not represented anywhere above.

The supplied mock designs are **visual specifications**, not loose inspiration. Claude Code must reproduce them faithfully in working, accessible, responsive code. It must not redesign them, change the visual direction, invent a generic SaaS dashboard, or flatten a complete mock into one background image.

If a mock conflicts with a product, legal, accessibility, or security requirement, preserve its visual intent while implementing the required behavior, and record the discrepancy in `docs/design-decisions.md`.

---

## 2. Product definition

Winning Tips is an African sports-intelligence and prediction platform. It provides data-driven predictions, transparent historical performance, understandable analysis, country-appropriate premium access, community features, and optional outbound links to licensed bookmakers.

Winning Tips is **not a bookmaker**. It must never:

- accept or hold betting stakes;
- maintain a betting wallet;
- settle bets or pay winnings;
- process bookmaker deposits or withdrawals;
- perform bookmaker KYC;
- claim guaranteed wins or risk-free betting;
- present generated prose as a statistical probability;
- imply that a bookmaker relationship changes the ranking of a prediction;
- reverse-engineer private bookmaker APIs.

The core user journey is:

```text
Discover prediction
  → inspect probability, evidence, and risk
  → compare supported local bookmaker offers where lawful
  → choose an operator independently
  → leave Winning Tips through a tracked, validated redirect
  → review and optionally place the bet on the bookmaker's own platform
```

Winning Tips may earn subscription revenue and disclosed affiliate revenue. Editorial/model ranking must remain independent of affiliate payout.

### Launch sports

The Ghana MVP supports real competitive events in:

1. Football
2. Basketball
3. Tennis

Later country-configurable additions may include boxing, MMA, table tennis, esports, cricket, rugby, and volleyball. Do not publish “predictions” for virtual football, crash games, slots, roulette, or other generated/casino outcomes. Each sport requires its own validated model and data-quality rules.

### Product principles

- **Evidence before excitement:** probabilities come from versioned statistical models.
- **Transparency before marketing:** publish complete graded history, including losses and voids.
- **Uncertainty is visible:** show risk factors, data quality, freshness, and suspension states.
- **Mobile first, not mobile only:** optimize for African mobile usage while preserving strong tablet and desktop experiences.
- **One canonical record:** website, app surfaces, Telegram, WhatsApp, and result reports read the same published tip.
- **Country configuration over branching:** no scattered `if country === "GH"` logic.
- **Responsible participation:** age gate, local notices, limits, self-exclusion resources, and no harmful engagement loops.

---

## 3. Africa-first rollout

Build the platform for multiple jurisdictions from the first schema and API, while launching commercially in stages.

| Phase | Markets | Objective |
|---|---|---|
| 1 | Ghana | Prove acquisition, data, predictions, payments, grading, and bookmaker handoff |
| 2 | Nigeria | Prove currency, payment, operator, and subnational jurisdiction abstraction |
| 3 | Kenya, South Africa, Uganda, Tanzania | Establish a repeatable regional launch engine |
| 4 | Côte d’Ivoire, Senegal, Cameroon, selected West African markets | Add language and regional payment/operator variants |
| 5 | Wider Africa | Launch vetted country clusters in parallel |

Use one product and domain with visible country editions, for example `/gh`, `/ng`, `/ke`, and `/za`. Country detection is a convenience, never a trap: show the active country in the header/profile and let the user change it. Persist an explicit choice. Do not infer legal eligibility from IP alone.

Every market is described by configuration, including:

```ts
type ServiceMode = "FULL" | "PREDICTIONS_ONLY" | "LIMITED" | "DISABLED";

interface CountryConfiguration {
  countryCode: string;
  name: string;
  serviceMode: ServiceMode;
  currency: string;
  locale: string;
  timezone: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  minimumUserAge: number | null;
  paymentsEnabled: boolean;
  premiumEnabled: boolean;
  bookmakerLinksEnabled: boolean;
  enabledSports: string[];
  responsibleGamingUrl: string | null;
  regulatorName: string | null;
  termsVersion: string;
  enabled: boolean;
}
```

Country-specific data must include currency, localized pricing, payment methods, operators, licence evidence, legal text, minimum age, timezone, enabled sports/leagues, community channels, campaigns, and data-retention requirements.

### Market launch gate

A country cannot change to `FULL` until product, legal/compliance, payments, data, operations, and support have signed off. At minimum verify:

- current legal status of prediction subscriptions and affiliate linking;
- regulator, applicable national/subnational rules, and minimum age;
- enabled operators and current licence evidence;
- approved partner URLs/API access;
- payment provider support and successful webhook tests;
- local pricing, currency, refunds, taxes, and customer support;
- responsible-gambling and help resources;
- fixture/odds coverage and local timezone jobs;
- localized terms, privacy policy, disclosures, and consent copy;
- notification templates and opt-out behavior.

Operator lists in this guide are candidates, not permanent legal truth. Verify them immediately before enabling a market and continuously thereafter.

---

## 4. Ghana first, Nigeria second

### Ghana MVP

- Currency: GHS.
- Primary payment preference: mobile money, then cards and bank transfer, subject to live provider capability.
- Initial sports: football, basketball, tennis.
- Initial operator research priority: SportyBet, Betway, Betika, betPawa, then 1xBet, MSport, BetKing, 22Bet, and PremierBet.
- Mobile-money renewals must support explicit reminder-and-renew flows; never assume unattended recurring debit is available.
- Store all dates in UTC and render schedules in Africa/Accra.

### Nigeria expansion

- Currency: NGN.
- Payment candidates: bank transfer, card, USSD, bank account, and supported wallets such as OPay, subject to current provider availability.
- Initial operator research priority: SportyBet, Bet9ja, BetKing, and MSport.
- Jurisdiction modeling must support state/subdivision-specific permission and the FCT; a single country-wide `licensed: true` flag is insufficient.
- Store all dates in UTC and render schedules in the relevant user/configured timezone.

### Exponential expansion rule

After Ghana and Nigeria are stable, build and use a repeatable `Country Launch Center` rather than duplicating deployments. New markets should be configuration, content, provider adapters, legal approval, and QA—not forks of the product.

---

## 5. Revenue and payments

There are two strictly separate money flows.

### 5.1 Winning Tips payments

Winning Tips may charge for premium subscriptions, memberships, premium content, or an ad-free tier. These payments belong to Winning Tips and are represented by internal orders, payment attempts, entitlements, renewals, refunds, and invoices/receipts.

### 5.2 Bookmaker payments

Deposits, stakes, bookmaker balances, winnings, withdrawals, KYC, and settlement belong entirely to the bookmaker. Winning Tips stores no bookmaker credentials and never accepts stake instructions or funds.

### Provider abstraction

Start with Paystack as a Ghana-oriented primary candidate and Flutterwave as fallback/regional candidate, but select providers through configuration and validate current capabilities before implementation.

```ts
interface PaymentProvider {
  initializePayment(input: InitializePaymentRequest): Promise<PaymentSession>;
  verifyPayment(reference: string): Promise<PaymentVerification>;
  refundPayment(input: RefundRequest): Promise<RefundResult>;
  getAvailableMethods(countryCode: string): Promise<PaymentMethod[]>;
  supportsCountry(countryCode: string): boolean;
  supportsRecurring(countryCode: string, method: PaymentMethod): boolean;
  verifyWebhook(signature: string, rawBody: Buffer): VerifiedWebhookEvent;
}
```

Implement `PaystackAdapter`, `FlutterwaveAdapter`, and future providers behind `PaymentService`. Never scatter provider SDK calls through UI routes.

### Country payment configuration

```text
CountryPaymentConfiguration
  countryCode, currency
  primaryProvider, fallbackProvider
  enabledMethods[]
  recurringMethods[]
  minimumAmount, maximumAmount
  providerConfigurationReference
  enabled
```

### Country pricing

Do not convert one USD price mechanically across Africa. Store local purchasing-power-aware prices in `CountryPlanPrice`:

```text
countryCode, planId, currency
monthlyPrice, quarterlyPrice, yearlyPrice
introductoryPrice, effectiveFrom, effectiveUntil, enabled
```

Prices must be editable in Admin without deployment. Money uses integer minor units and ISO currency codes; never use floating-point arithmetic.

### Payment lifecycle

```text
CREATED → PENDING → SUCCEEDED → ENTITLEMENT_GRANTED
                  ↘ FAILED / EXPIRED
SUCCEEDED → REFUND_PENDING → REFUNDED / REFUND_FAILED
```

- The server creates the payment reference and amount.
- The callback page never grants access by itself.
- A verified server-to-server webhook or explicit provider verification grants entitlement.
- Webhooks are signed, idempotent, replay-safe, logged, and retryable.
- Duplicate events must not extend membership twice.
- Renewal reminders are scheduled, consent-aware, and localized.
- Provide a manual support reconciliation tool with a full audit trail.

---

## 6. Bookmaker integration

### Non-negotiable rules

- Use official partner APIs, licensed odds feeds, approved deep links, affiliate URLs, or official booking-code methods only.
- Never scrape authenticated areas or reverse-engineer private endpoints.
- Never enable an operator solely because its brand exists in a country.
- Require current licence evidence, an approved destination, age/responsible-gaming information, and internal approval.
- Affiliate commission cannot influence the displayed model probability, confidence, best-odds calculation, or default sorting.
- Clearly label affiliate links and the time at which odds were last verified.

### Operator schema

```text
Bookmaker
  id, slug, name, logoAssetId, canonicalWebsite

OperatorJurisdiction
  id, bookmakerId
  countryCode, subdivisionCode?
  regulator, licenseNumber
  validFrom, validUntil, verificationSource, verifiedAt
  status: RESEARCH | PENDING | APPROVED | SUSPENDED | EXPIRED
  officialUrl, affiliateUrl?
  affiliateCampaignId?, affiliateSubIdTemplate?
  supportsDeepLinks, supportsBookingCodes
  supportsPrefilledBetslips, supportsOddsFeed
  minimumAge?, responsibleGamingUrl?
  redirectEnabled
```

### Integration levels

1. **Official deep link:** open the relevant event or supported prefilled betslip.
2. **Official booking code:** display copyable code, instructions, expiry/freshness, and an operator button.
3. **Affiliate landing:** open the approved local operator landing page when no event link is available.

```ts
interface BookmakerAdapter {
  operatorId: string;
  supportsCountry(countryCode: string, subdivisionCode?: string): boolean;
  getAffiliateUrl(context: RedirectContext): Promise<string>;
  getDeepLink?(selection: Selection, context: RedirectContext): Promise<string | null>;
  getBookingCode?(selection: Selection, context: RedirectContext): Promise<BookingCodeResult | null>;
}
```

Capabilities come from the database and adapter; the UI never assumes all operators support the same action.

### Redirect service

All outbound operator buttons use a server route such as `/go/{operatorSlug}/{tipId}`. The service must:

1. resolve the user’s explicitly selected country and optional subdivision;
2. load the approved operator jurisdiction;
3. check service mode, redirect flag, licence validity, and age-gate state;
4. validate the destination against an allowlist;
5. attach non-sensitive affiliate sub-identifiers;
6. record a privacy-respecting click event;
7. return an HTTP 302 redirect.

Record user ID when lawful/available, anonymous session ID, tip ID, operator ID, country, source surface, campaign, odds snapshot ID, and timestamp. Never log access tokens, credentials, payment data, or full sensitive query strings.

### Odds freshness

Store immutable `OddsSnapshot` records with event, operator, market, outcome, decimal odds, capture time, source, and source update time. A configurable threshold determines freshness. When stale, hide numerical comparison and show: **“Open bookmaker to see current odds.”** Do not imply that displayed odds are guaranteed.

---

## 7. Suggested technical architecture

Use a TypeScript monorepo. The exact vendors may change, but preserve the boundaries.

```text
Browser / PWA
  → Next.js web application
  → API/service layer
  → PostgreSQL
  → Redis + BullMQ workers
  → sports-data, odds, payments, bookmaker, messaging adapters
```

Recommended baseline:

- Web: Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS plus CSS variables/design tokens.
- Forms/validation: React Hook Form and Zod.
- Database: PostgreSQL with Prisma.
- Jobs: Redis and BullMQ on persistent worker compute.
- Testing: Vitest, Testing Library, Playwright.
- Observability: structured logs, error tracking, metrics, queue dashboards, and audit logs.
- Assets: object storage/CDN for uploaded/generated media; optimized static assets for the web build.
- Deployment: web and worker deploy independently; never run long jobs inside request handlers.

### Repository convention

```text
winning-tips/
├── CLAUDE.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── [country]/
│   │   │   │   ├── (public)/
│   │   │   │   ├── (auth)/
│   │   │   │   └── (app)/
│   │   │   ├── admin/
│   │   │   ├── api/
│   │   │   └── go/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── predictions/
│   │   │   ├── bookmakers/
│   │   │   ├── community/
│   │   │   └── payments/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── public/assets/
│   ├── worker/
│   │   └── src/jobs/
│   └── admin/                 # optional separate app; otherwise apps/web/app/admin
├── packages/
│   ├── database/
│   ├── domain/
│   ├── design-system/
│   ├── country-config/
│   ├── sports-data/
│   ├── odds/
│   ├── prediction-engine/
│   ├── bookmaker-integrations/
│   ├── payments/
│   ├── messaging/
│   ├── analytics/
│   └── config/
├── design-reference/
│   ├── manifest.json
│   ├── desktop/
│   ├── tablet/
│   ├── mobile/
│   └── shared/
├── docs/
│   ├── WINNING_TIPS_DEVELOPMENT_GUIDE.md
│   ├── design-decisions.md
│   ├── country-launches/
│   ├── integrations/
│   └── runbooks/
├── tooling/
└── .env.example
```

Feature code owns its UI, actions, queries, schema, and tests. Shared `ui` components remain presentational. External provider payloads are normalized at package boundaries and must not leak across the application.

### Secrets and environments

- Maintain local, preview/staging, and production environments.
- Put only names/placeholders in `.env.example`; never commit real secrets.
- Separate credentials per environment and rotate compromised credentials.
- Mock providers locally; use sandbox accounts in staging.
- Guard all production admin mutations with authorization and audit logging.

---

## 8. Core domain model

At minimum, model:

- Identity: `User`, `Profile`, `Consent`, `AgeGateRecord`, `Session`.
- Geography: `Country`, `Subdivision`, `CountryConfiguration`, `CountryPlanPrice`.
- Sports: `Sport`, `Competition`, `Season`, `Team`, `Player`, `Event`, `EventParticipant`.
- Markets: `Market`, `Outcome`, `Bookmaker`, `OperatorJurisdiction`, `OddsSnapshot`.
- Models: `PredictionModel`, `ModelVersion`, `ModelRun`, `Prediction`, `PredictionFactor`, `PredictionRevision`.
- Publishing: `PublishedTip`, `TipBookmakerOffer`, `SavedTip`.
- Settlement: `Result`, `PredictionGrade`.
- Commerce: `Plan`, `Subscription`, `Entitlement`, `Payment`, `PaymentAttempt`, `Refund`.
- Messaging: `Notification`, `NotificationPreference`, `DeliveryLog`, `MessageTemplate`.
- Community: `CommunityPost`, `CommunityComment`, `CommunityReaction`, `Report`, `ModerationAction`, `Challenge`, `ChallengeEntry`.
- Attribution: `AffiliateClick`, `AffiliateConversion`.
- Operations: `AutomationJob`, `ProviderHealth`, `AuditLog`, `FeatureFlag`.

Use stable internal IDs and separate provider IDs. All important records include `createdAt` and `updatedAt`; regulated/audited records also include actor, source, revision, and immutable event history.

### Prediction lifecycle

```text
GENERATED → DRAFT → REVIEW_REQUIRED → APPROVED → PUBLISHED → GRADED
                                      ↘ SUSPENDED
```

Once published, a selection, market, or probability is never silently overwritten. Material change creates a timestamped revision and visible update. A suspension remains in history.

```ts
interface NormalizedPrediction {
  eventId: string;
  marketId: string;
  outcomeId: string;
  modelProbability: number;
  marketImpliedProbability: number | null;
  valueEdge: number | null;
  confidenceScore: number;
  confidenceBand: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "AVOID";
  dataQuality: number;
  modelVersionId: string;
  generatedAt: string;
}
```

Confidence describes model strength, not certainty. The product must never translate `HIGH` into “sure win.”

---

## 9. Sports data and prediction engine

### Provider boundary

```ts
interface SportsDataProvider {
  getSports(): Promise<NormalizedSport[]>;
  getCompetitions(input: CompetitionQuery): Promise<NormalizedCompetition[]>;
  getFixtures(input: FixtureQuery): Promise<NormalizedEvent[]>;
  getEvent(id: string): Promise<NormalizedEvent>;
  getStandings(input: StandingsQuery): Promise<NormalizedStanding[]>;
  getTeamStats(input: TeamStatsQuery): Promise<NormalizedTeamStats>;
  getPlayerStats(input: PlayerStatsQuery): Promise<NormalizedPlayerStats>;
  getHeadToHead(input: HeadToHeadQuery): Promise<NormalizedHeadToHead>;
  getInjuries(input: InjuryQuery): Promise<NormalizedInjury[]>;
  getLineups(input: LineupQuery): Promise<NormalizedLineup[]>;
  getResults(input: ResultsQuery): Promise<NormalizedResult[]>;
}
```

Normalize vendor data immediately. Preserve provenance and freshness. Missing or unreliable data lowers the data-quality score and can suppress a tip.

### Version-one models

**Football:** ensemble of Elo, Poisson goals, recent and opponent-adjusted form, home advantage, attack/defence strength, goals/xG where reliable, rest, verified injuries/lineups, and market information. Initial markets: 1X2, double chance, draw-no-bet, totals, both teams to score, and team totals.

**Basketball:** team Elo, offensive/defensive rating, pace, form, home advantage, rest/back-to-back, verified injuries, expected starters, and opponent strength. Initial markets: moneyline, spread, game total, team total; add halves only after validation.

**Tennis:** overall and surface Elo, serve/return metrics, break-point performance, form, fatigue, travel, opponent quality, head-to-head, and verified injuries. Initial markets: match/set winner, player to win a set, total games, and set handicap.

### AI/LLM boundary

An LLM may turn structured factors into readable explanations. It may not invent the probability, modify the selection, manufacture injuries, or claim causal certainty. Every generated explanation must be traceable to supplied factors and pass factual/format validation.

### Evaluation

Backtest and continuously track Brier score, log loss, calibration, accuracy, simulated ROI with explicit assumptions, precision by confidence bucket, and performance by sport/league/market/model version. Public metrics use graded published tips, not cherry-picked internal runs.

Auto-publish rules are configurable. Example:

```text
dataQuality ≥ threshold
AND confidenceScore ≥ threshold
AND modelVersion = ACTIVE
AND event = SCHEDULED
AND provider data is fresh
AND no integrity alert
→ eligible for auto-publish
```

Anything else enters review or is rejected.

---

## 10. Automation and distribution

Automation is a first-class subsystem, not a collection of cron expressions in web routes.

### Queues

Use queues for fixtures, statistics, odds, predictions, publishing, pre-match checks, results, grading, notifications, messaging, affiliate health, payments, and analytics.

Every job must have:

- a deterministic/idempotency key;
- retry policy with exponential backoff;
- timeout and concurrency limit;
- structured status and error details;
- dead-letter handling and an admin retry action;
- correlation IDs across the pipeline;
- metrics for duration, attempts, failures, lag, and last success.

### Illustrative country-local schedule

```text
05:00 fixtures → 05:05 normalize → 05:10 statistics → 05:20 odds
→ 05:30 model run → 05:40 confidence/quality → 05:45 select
→ 05:50 publish → 06:05 Telegram → 06:10 WhatsApp
```

This is configurable per country and league; it is not hardcoded. The pipeline must also run incrementally when providers update data.

### Pre-match rechecks

Recheck approximately 6 hours, 2 hours, 60 minutes, and 30 minutes before start, with sport-specific adjustments. Evaluate postponement/cancellation, lineups, injuries, odds movement, data integrity, and market availability. Material change suspends the tip or creates an explicit revision; never rewrite history.

### Results and grading

Fetch official results, apply market-specific settlement rules, and grade `WIN`, `LOSS`, `VOID`, or `PUSH`. Update the canonical result, model statistics, dashboards, public performance, and opted-in messages. A manual correction requires a reason, actor, before/after state, and audit log.

### Telegram and WhatsApp

- Telegram may support `/today`, `/football`, `/basketball`, `/tennis`, `/highconfidence`, `/results`, `/performance`, and `/help`.
- WhatsApp must use the official Business Platform, approved templates where required, explicit opt-in, preferences, and immediate opt-out.
- Both channels render canonical tips and canonical results.
- Notification preferences cover sports, leagues, minimum confidence, channel, quiet hours, and frequency.
- Do not spam, send misleading urgency, or conceal losses.

---

## 11. Visual design system

The approved direction is energetic African sports intelligence: deep stadium navy, electric green, royal blue, confident type, sports imagery, rounded surfaces, restrained glow, and highly legible white/data surfaces. It must feel like a serious sports product—not a casino, meme page, or generic enterprise dashboard.

### Base tokens

Treat these as initial tokens; sample the supplied mocks and update the token file if their exact approved values differ.

```css
:root {
  --color-navy-950: #02152f;
  --color-navy-900: #03204a;
  --color-navy-800: #07336b;
  --color-blue-500: #0878ff;
  --color-blue-400: #20a4ff;
  --color-green-500: #18e85d;
  --color-green-400: #4bff72;
  --color-green-300: #83ff90;
  --color-surface: #f7faff;
  --color-white: #ffffff;
  --color-red: #ff4757;
  --color-gold: #ffc629;
}
```

Use green for positive/win/action, red for loss/error, gold for premium/featured, and neutral colors for void/push. Never communicate status through color alone.

### Typography and shape

- Preferred sans-serif: Inter or Manrope, using the font visible in the mocks when provided/licensed.
- Headings: bold/extra-bold with compact sports-editorial rhythm.
- Body: regular/medium and readable at small mobile sizes.
- Use a consistent spacing scale, radius scale, shadows, focus rings, and container widths extracted from the mocks.
- Neon glow is decorative and restrained; it must not reduce data contrast.

### Reusable components

Build, document, and test reusable primitives for buttons, icon buttons, cards, chips, tabs, filters, confidence/data-quality meters, sport icons, avatars, modals/drawers, empty/error/skeleton states, odds rows, result badges, plan cards, charts, post cards, and navigation.

Do not abstract prematurely: create a shared component when at least two screens use the same visual/behavioral pattern. Allow explicit variants rather than chains of one-off class overrides.

---

## 12. Responsive foundations

Reference viewport families:

| Family | Design target | Implementation range | Navigation |
|---|---:|---:|---|
| Mobile | 390 × 844 | 320–767 px | Sticky bottom navigation; compact header |
| Tablet | 834 × 1112 | 768–1199 px | Mock-led compact header and/or bottom navigation |
| Desktop | 1440 × 1024 | 1200 px and above | Left sidebar plus top utilities where shown |

These are reference targets, not three fixed canvases. Test at 320, 360, 390, 430, 768, 834, 1024, 1280, 1440, and 1920 pixels. Content must interpolate cleanly between them.

Rules:

- Do not scale an entire desktop screen down.
- Preserve content priority, not necessarily identical geometry, across breakpoint-specific mocks.
- Use CSS grid/flex, fluid widths, `clamp()`, aspect ratios, and content-driven sizing; avoid absolute positioning for structural layout.
- Absolute positioning is acceptable for deliberate hero decoration when bounded by a positioned container.
- Cards normally move from 3–4 columns on desktop, to 2 on tablet, to 1 on mobile unless the mock specifies otherwise.
- Convert wide tables to labeled cards or controlled horizontal regions on mobile—never clip data.
- Filters become a drawer or compact horizontally scrollable row when the mock shows it.
- Modals should become bottom sheets/full-height dialogs on narrow screens when appropriate.
- Respect safe-area insets for sticky mobile navigation.
- Use touch targets of at least 44 × 44 CSS pixels.
- No horizontal page scroll at any required viewport.

---

## 13. Mock-to-code protocol for Claude Code

This workflow is mandatory whenever mock images are present.

### 13.1 File placement and naming

The product owner places references in:

```text
design-reference/
  desktop/{screen}.png
  tablet/{screen}.png
  mobile/{screen}.png
  shared/
```

Use predictable screen slugs such as:

```text
landing, login, signup, onboarding, home, tips, tip-detail,
results, community, community-detail, profile, notifications,
saved-tips, pricing, checkout, payment-status, responsible-gaming,
admin-dashboard, admin-predictions, admin-countries
```

If variants exist, suffix state and index: `tips-filter-open.png`, `home-empty.png`, `tip-detail-02.png`.

Maintain `design-reference/manifest.json`:

```json
{
  "home": {
    "route": "/[country]/home",
    "desktop": "desktop/home.png",
    "tablet": "tablet/home.png",
    "mobile": "mobile/home.png",
    "status": "approved"
  }
}
```

### 13.2 Before coding a screen

1. Find the route in the manifest and inspect **all available viewport mocks**.
2. Record image dimensions and inventory visible sections, order, navigation, text styles, colors, spacing, card geometry, imagery, icons, and interactive states.
3. Match visible assets to `public/assets/asset-manifest.json`; do not substitute arbitrary images silently.
4. Identify shared components already implemented.
5. Note discrepancies or missing states in `docs/design-decisions.md`.

Do not begin by inventing a new layout from the written feature list when a mock exists.

### 13.3 Mapping the three viewport families

- If desktop, tablet, and mobile mocks exist, each is authoritative for its family. Implement responsive interpolation between them.
- If only desktop and mobile exist, derive tablet by preserving the same hierarchy: usually two columns, compact navigation, reduced decorative density, and no hidden core content.
- If only one mock exists, reproduce it at its reference viewport, then derive other sizes conservatively using the responsive foundations above. Mark derived layouts for product-owner review.
- Do not hide a core feature simply because it does not fit; reflow it.
- Do not reorder sections unless a provided viewport mock does so or usability requires it.
- Copy visible wording from mocks only when it is approved product copy. Use fixtures for names, scores, dates, and metrics; never hardcode them in the component.

### 13.4 Build method

Recreate each mock as semantic HTML and components:

- text remains live text;
- buttons/links remain interactive controls;
- data cards render from typed fixtures/API data;
- images are separate optimized assets;
- gradients, surfaces, and simple decoration use CSS;
- icons come from the chosen consistent icon set or supplied originals.

Never ship a full-screen screenshot as the page implementation.

### 13.5 Visual validation loop

For every screen:

1. Render at the exact mock viewport.
2. Capture a screenshot.
3. Compare side-by-side or with an overlay/diff.
4. Fix structural differences first: container, section order, grid, alignment, and scale.
5. Then fix typography, spacing, color, radius, shadows, borders, and imagery.
6. Repeat for desktop, tablet, and mobile.
7. Test intermediate widths and long/short real-world content.

A screen is not complete because it “looks close.” Its layout must be demonstrably faithful and behaviorally complete.

### 13.6 What Claude Code must not do

- Do not redesign or “modernize” an approved mock.
- Do not change colors, typography, navigation, copy hierarchy, or card structure based on personal preference.
- Do not use placeholder gradients when a supplied hero/athlete asset exists.
- Do not introduce glassmorphism, excessive neon, or casino motifs unless present in the approved mocks.
- Do not hardcode one viewport with pixel coordinates.
- Do not place production content directly in page components.
- Do not fabricate performance figures, testimonials, odds, licence information, or live events.
- Do not mark a screen complete without responsive screenshots and tests.

---

## 14. Screen-by-screen specification

Mocks decide exact geometry and styling. The descriptions below define required content and behavior.

### 14.1 Public landing page

Sections: navigation/country selector, hero, featured predictions, supported sports, how it works, transparent performance, community, Telegram/WhatsApp, pricing, FAQ, responsible-gambling notice, footer.

Suggested hero copy: **“Your Home for Smart Sports Predictions.”** Primary CTA: **“View Today’s Tips.”** Secondary CTA: **“Join the Community.”** Use no fake accuracy numbers or fabricated social proof.

Desktop may use a split hero with live HTML copy and layered athlete/phone/data assets. Tablet reduces overlap and decoration. Mobile stacks copy, CTAs, and hero visual in the order shown by its mock; primary CTAs become comfortably full-width when specified.

### 14.2 Authentication and onboarding

Screens: sign in, sign up, password reset/magic link, verification, country selection, age acknowledgement, sports/preferences, notification opt-in, terms/privacy consent.

Social login is optional. Never pre-check marketing consent. Country choice must be editable later. Mobile uses a focused single-column flow; desktop may use a visual split panel if mocked.

### 14.3 Home/dashboard

Include greeting, active country, genuine performance summary, today’s top picks, sport exploration, recent performance, upcoming matches, saved tips, and community/messaging CTA as the mock permits.

A prediction card contains sport, competition, participants, kickoff, market/selection, model probability, confidence band, data quality/freshness where relevant, best current local offer, save action, and analysis action. Empty, loading, stale, suspended, premium-locked, and error states are required.

Desktop uses sidebar and mock-defined multi-column regions. Tablet preserves dashboard hierarchy in two-column or stacked sections. Mobile prioritizes top picks, keeps cards single-column, and accounts for sticky bottom navigation.

### 14.4 Tips listing

Filters: today/tomorrow/upcoming, high confidence, value picks, sport, league, market, minimum probability, and data quality where supported. Filters must serialize to URL/query state and survive refresh.

The page needs result count, sort, active filter chips, reset, pagination/infinite loading, and no-results state. Desktop may show persistent filter controls; tablet compacts them; mobile uses the supplied filter drawer/sheet pattern.

### 14.5 Tip detail

Route: `/[country]/tips/{slug}`.

Show participants, competition, kickoff, event state, selection/market, model probability, confidence, data quality, last model update, analysis, recent form, relevant stats, head-to-head where meaningful, verified injuries/lineups, “why this prediction,” risk factors, revision/suspension notice, and bookmaker comparison.

The bookmaker panel includes local approved operators only, odds and freshness, appropriate action per capability, affiliate disclosure, age reminder, and a clear statement that the operator sets the final price. On mobile, the action region may be sticky if present in the mock but must not obscure analysis or responsible-gambling content.

### 14.6 Results and performance

Ranges: today, 7 days, 30 days, all time, and optionally custom. Show total published tips, wins, losses, voids/pushes, win rate with sample size, and units profit/loss only when the calculation is defined and disclosed.

Include trend chart, recent graded tips with final score/result, and breakdown by sport/league/market. Charts require text summaries/tooltips and cannot rely on color alone. Losses remain as visible as wins.

### 14.7 Community

Include feed, rooms/topics, posts, comments, reactions, share, report, moderation states, community guidelines, and accuracy/participation leaderboard. Challenges reward analytical accuracy and participation—not stake size, deposits, losses, or wagering volume.

Desktop may use feed plus side rails; tablet reduces to feed plus one contextual rail or stacked modules; mobile uses a single feed and bottom-sheet composer. Provide deleted, locked, reported, empty, and loading states.

### 14.8 Profile and settings

Include identity, avatar, country, locale/timezone, plan/renewal, saved tips, notification preferences, channel connections, security/sessions, consent history, responsible-gambling controls, data export, and account deletion.

Country changes must explain their effect on currency, pricing, operators, and availability. Destructive settings require clear confirmation and server authorization.

### 14.9 Pricing and checkout

Display country-native currency, local plan prices, included features, renewal model, available payment methods, refund/cancellation terms, and secure-provider disclosure.

Checkout states: method selection, initialization, provider handoff/prompt, pending, verifying, success, failed, expired, cancelled, and duplicate-safe retry. Mobile-money pending states should explain that confirmation may take time. Never display access until server verification succeeds.

### 14.10 Notifications and saved tips

Notifications group new/updated/suspended/graded tips, payment events, and community activity. Include read state, deep links, preferences, and pagination. Saved tips preserve the saved selection/revision and show current event status.

### 14.11 Responsible-gambling and legal

Provide country-aware age notice, educational risk copy, limits/preferences where applicable, cool-off/self-exclusion pathways, help resources, affiliate disclosure, terms, privacy, cookies/consent, and contact/support. Do not use celebratory animation after bookmaker redirects or losses.

### 14.12 Admin command center

Admin is role-protected and fully audited. Required areas:

- overview: users, revenue, subscriptions, published tips, grading, queue/provider health;
- prediction review: factors, model version, quality, approve/reject/suspend/revise;
- events/results: provider reconciliation and settlement correction;
- countries: launch checklist, service mode, language, sports, age/legal content;
- payments/pricing: providers, methods, plans, webhook/reconciliation status;
- operators: jurisdiction, licence evidence/expiry, capabilities, URLs, enable/disable;
- content/community: moderation queue, reports, bans/appeals;
- messaging: templates, opt-ins, delivery health, failed-message retry;
- models: versions, evaluation, activation/rollback;
- automation: job timelines, failures, dead-letter replay;
- audit: actor, action, target, before/after, reason, timestamp.

High-risk changes require explicit confirmation and optional dual approval. Licence expiry or provider-health failure can automatically disable affected redirects.

---

## 15. Asset strategy

The owner already has a logo and will add mock screens. Preserve originals and map every production asset explicitly.

```text
apps/web/public/assets/
├── brand/
│   ├── winning-tips-logo.svg
│   ├── winning-tips-mark.svg
│   └── favicon.svg
├── backgrounds/
│   └── stadium-blue-green.webp
├── athletes/
│   ├── football-player.webp
│   ├── basketball-player.webp
│   ├── tennis-player.webp
│   └── athlete-group.webp
├── community/
│   ├── cheering-supporters.webp
│   └── crowd-overlay.webp
├── sports/
├── decorations/
│   ├── neon-green-ribbon.webp
│   ├── trophy.webp
│   ├── more-winners-together.webp
│   ├── smarter-bets-brighter-days.webp
│   └── different-games-same-wins.webp
├── mockups/
│   └── phone-dashboard.webp
├── bookmakers/
│   └── {country}/{operator}.svg
└── placeholders/
```

Rules:

- Keep high-quality source artwork outside the public build, for example `design-reference/shared/source-assets/`.
- Prefer SVG for logos/icons and WebP/AVIF for photos/illustrations; retain PNG only for required transparency/fidelity.
- Never trace, recolor, crop, or distort the owner’s logo without approval.
- Bookmaker logos must be official, current, and used according to partner terms.
- Provide meaningful alt text for informative images and empty alt text for decoration.
- Set explicit dimensions/aspect ratios to prevent layout shift.
- Use responsive image sizing and lazy-load below-the-fold media; do not lazy-load the primary LCP hero image.
- Never use copyrighted athlete photography without rights. Generated people must not imply endorsements by real athletes.

Create `apps/web/public/assets/asset-manifest.json` mapping asset ID, file, role, source/licence, allowed crops, focal point, alt text, and pages. If an asset is missing, use an obvious development placeholder and log it; do not silently invent a production substitute.

---

## 16. Accessibility, content, and localization

Target WCAG 2.2 AA.

- Semantic landmarks and heading order.
- Full keyboard access and visible focus.
- Labels, descriptions, and actionable validation errors.
- Minimum 4.5:1 text contrast where applicable.
- Reduced-motion support.
- Screen-reader names for icons and charts.
- Focus trapping/restoration for dialogs and sheets.
- Status text/icons in addition to color.
- Zoom and 320 px reflow without loss of function.

Use an internationalization layer from day one. Store message keys, not Ghana-only strings in components. Use `Intl` for currencies, dates, timezones, and plural rules. Keep GHS/NGN/KES and language expansion in fixtures/tests. Avoid text embedded in generated imagery unless it is purely decorative; live product copy must remain translatable.

Tone is confident, clear, and honest. Say “prediction,” “model probability,” and “risk factors”; never “banker,” “sure odds,” “guaranteed,” “fixed match,” or “risk free.”

---

## 17. Security, privacy, and integrity

- Server-side authentication and role/permission checks for every protected action.
- Least-privilege admin roles and MFA for privileged users.
- CSRF protection where relevant, secure cookies, output encoding, CSP, and rate limiting.
- Validate all redirect destinations; prevent open redirects.
- Verify provider webhook signatures over raw bodies and enforce idempotency.
- Encrypt sensitive data in transit and at rest; minimize collection and retention.
- Do not expose provider secrets, internal model details, or private user data to the browser.
- Moderate user content, sanitize rich text, scan uploads, and limit file types/sizes.
- Protect prediction publication and grading from unauthorized mutation.
- Keep immutable audit events for payments, operator configuration, publishing, grading, and admin access.
- Document incident response, backups, restore tests, provider outage behavior, and kill switches.

Feature flags must be able to disable payments, premium checkout, messaging, one sport, one provider, one operator, one country, or all outbound redirects without redeploying.

---

## 18. Performance and reliability

- Establish budgets for JavaScript, image weight, and Core Web Vitals.
- Render public discovery pages server-side where appropriate; cache stable country/sport content with safe invalidation.
- Keep personalized/entitlement data private and uncached across users.
- Use skeletons that match final geometry.
- Paginate large histories and feeds.
- Degrade gracefully when odds, sports data, messaging, or payment providers fail.
- Show freshness and temporarily suppress claims rather than displaying stale data as live.
- Queue work outside request/response paths.
- Use database constraints and transactions for money, entitlements, publishing, and grading.

---

## 19. Testing and definition of done

### Required tests

- Unit: probability/settlement utilities, country rules, prices, provider normalization, redirect allowlists.
- Integration: payment webhooks, entitlement grant, provider retries, operator eligibility, publishing/revision/grading.
- Contract: mocked sports, odds, payment, messaging, and bookmaker provider payloads.
- Component: prediction cards, filters, status states, checkout, navigation, accessibility.
- End-to-end: onboarding, country selection, subscribe, browse/save tip, operator handoff, result history, preferences, admin review.
- Visual regression: every approved screen at desktop/tablet/mobile reference viewport.
- Responsive: intermediate widths, 200% zoom, long translations, large font settings, slow network.
- Security: authorization, webhook replay, open redirect, XSS/user content, rate limits, secret leakage.
- Failure drills: stale odds, missing result, provider outage, delayed webhook, duplicated jobs, licence expiry.

### Screen definition of done

A screen is done only when:

- route, data, permissions, interactions, and all major states work;
- exact reference-viewport screenshots have been compared to supplied mocks;
- desktop, tablet, mobile, and intermediate widths pass without overflow;
- keyboard and screen-reader behavior is verified;
- loading, empty, error, stale, offline/degraded, and permission states exist as relevant;
- no fabricated production claims/data remain;
- tests pass and screenshots are attached to the implementation review;
- assumptions and mock discrepancies are documented.

### Feature definition of done

In addition to screen completion: migrations are safe, telemetry exists, admin/support tools exist, failure/retry behavior is tested, security/privacy reviewed, localization keys added, and rollback/kill switch documented.

---

## 20. Implementation sequence

### Foundation

1. Monorepo, CI, environments, lint/type/test setup.
2. Design tokens, layout shells, asset and design-reference manifests.
3. Identity, country selection/configuration, permissions, audit logging.
4. Provider interfaces and local fixtures.

### Ghana MVP

1. Public landing, auth/onboarding, home, tips, tip detail, results, profile.
2. Football data normalization and version-one model; then basketball and tennis.
3. Prediction review, publishing, revisions, results, grading.
4. Ghana plans, payment adapter, entitlement and renewal reminders.
5. Operator registry, odds snapshots, comparison and safe redirects.
6. Notification preferences, Telegram, then WhatsApp.
7. Community basics and moderation.
8. Admin launch center and operational runbooks.

### Nigeria proof of architecture

1. Add NG configuration and pricing without forking core code.
2. Add payment methods/providers through adapters.
3. Add subdivision-aware operator permissions.
4. Validate localized screens, notification templates, and support flow.
5. Complete legal/provider/operator launch gates.

### Regional scale

Build reusable country onboarding, translations, M-Pesa/mobile-money variants, new sport models only where validated, operator-health automation, and launch dashboards. Launch by readiness, not by an arbitrary calendar.

---

## 21. Claude Code operating rules

Claude Code must follow these rules for every implementation task:

1. Read this guide, the repository `CLAUDE.md`, the design manifest, all mocks for the target screen, and nearby code before editing.
2. State the target route, reference mocks, reused components, data source, and acceptance checks in the working plan.
3. Preserve unrelated code and user changes. Make small, reviewable edits.
4. Use strict TypeScript. Avoid `any`, silent type casts, and duplicated domain constants.
5. Keep business logic in domain/services; keep UI components focused on rendering and interaction.
6. Use provider interfaces and country configuration; never embed country/operator/provider behavior in page conditionals.
7. Use real semantic controls and accessible states.
8. Never fabricate production data. Seeded demo content must be visibly and structurally isolated from production.
9. Never expose secrets or log sensitive data.
10. Run type checks, lint, targeted tests, end-to-end tests where relevant, and visual comparisons before declaring completion.
11. Report changed files, validation performed, screenshots produced, unresolved assumptions, and any deliberate mock deviation.
12. Stop and request product-owner input only when missing information would materially alter product behavior, legality, payment flow, or an approved visual; otherwise use the conservative documented default and record it.

### Required implementation report template

```text
Implemented:
- ...

Mock mapping:
- Desktop: design-reference/desktop/...
- Tablet: design-reference/tablet/...
- Mobile: design-reference/mobile/...

Validation:
- Typecheck: pass/fail
- Tests: pass/fail
- Visual comparison: pass/fail, viewport list
- Accessibility: pass/fail

Assumptions/deviations:
- None / ...

Remaining work:
- None / ...
```

---

## 22. Decisions that require explicit owner/legal approval

Do not guess these:

- production plan prices and refunds;
- final brand font and licensed imagery;
- regulator-approved wording and minimum age per jurisdiction;
- production operator enablement and affiliate terms;
- whether specific payment methods support recurring charges at launch;
- public performance formula and unit-staking assumptions;
- moderation/appeal policy and data-retention periods;
- launch dates and expansion priority changes;
- material deviations from approved mocks.

Everything else should be implemented using the abstractions, conservative defaults, and verification process in this guide.

---

## 23. Final product test

Winning Tips succeeds when a Ghanaian user can open a fast, faithful mobile experience; understand a prediction and its uncertainty; verify transparent historical performance; pay Winning Tips through a suitable local method; receive only opted-in updates; and, where lawful, choose an approved local bookmaker through a safe, disclosed handoff—while Winning Tips never touches the stake.

The same codebase must then launch Nigeria by changing configuration, adding verified integrations, completing legal review, and supplying localized mocks/content—not by rebuilding the product.
