# Smart Tips

**Read the game. Win the cash.**

Smart Tips is a mobile-first football prediction platform designed around clear analysis, transparent results, and curated prediction Decks. This repository contains a single Next.js application for the public site, account area, premium experience, and future admin tools.

## Stage status

VIP 2: FHLCZX
VIP 3: 90LUWU

Stage 4 authentication and the Stage 7 premium-payment foundation are implemented. Results settlement and performance analytics remain future stages.

The application now includes:

- Next.js 16 App Router with strict TypeScript
- Tailwind CSS 4 design system and responsive public shell
- Accessible session-aware header, mobile navigation, footer, and homepage
- Editorial Smart Tips visual identity (see Design system) and responsible-betting messaging
- Prisma ORM with PostgreSQL configuration
- Foundational `Setting` model and idempotent seed framework
- Zod environment validation
- ESLint, Vitest, type-check, and production-build scripts
- League, Team, and Fixture models with indexed external identifiers
- A configurable `FootballProvider` contract and deterministic mock provider
- Idempotent local fixture synchronization for past and upcoming dates
- UTC-safe yesterday, today, and tomorrow fixture queries
- A secret-protected `/api/cron/sync-fixtures` endpoint
- Seeded development football data and an `/admin/fixtures` browser
- Free and premium predictions with server-side premium redaction
- Public prediction board, search, day tabs, and prediction detail pages
- Editable Decks with pricing metadata and activation controls
- Admin prediction creation, editing, result updates, publishing, and unpublishing
- Public About, VIP, legal, and responsible-gaming routes
- Secure bcrypt password hashing and opaque, hashed database sessions
- Registration, login, logout, protected account, and editable user profiles
- Database-backed login rate limiting, password-reset tokens, and audit logs
- Role-based admin authorization and super-admin user access management
- Authenticated VIP visibility for active premium members and staff roles
- Database-managed day, weekly, monthly, and Deck-specific VIP plans
- Paystack hosted checkout with card and mobile-money channel requests
- Server-to-server transaction verification with exact amount, currency, reference, and customer checks
- SHA-512 signed Paystack webhooks, idempotent fulfilment, refunds, and expiring entitlements
- Customer payment history plus admin plan, payment, and subscription screens
- Responsive admin control panel with live metrics, recent audit activity, and quick actions
- Dedicated manual result management with audited settlement changes
- Operational integration status and expanded staff/user management

Deliberately not included yet: password-reset email delivery, automated results settlement, or advanced performance analytics. These belong to later stages in `build prompt.txt`.

## Design system

The interface is styled as a matchday paper rather than a dashboard: a warm
newsprint ground, near-black ink, hairline rules in place of drop shadows, and a
single electric blue lifted from the logo mark.

**The palette is light throughout.** There is no dark band and no inverted
variant of any component. Depth comes from three grounds — `surface` (white),
`paper` (the body tint) and `paper-2` (footer, auth panel, admin sidebar) — plus
rules. Photographs are framed as bordered plates rather than run full-bleed
behind text, so no section ever opens on a dark scrim.

Tokens live in `app/globals.css` under `@theme`, so every value is available both
as a CSS variable (`var(--color-blue)`) and as a Tailwind utility (`bg-blue`,
`border-line-2`, `text-muted`).

| Token group | Names |
| --- | --- |
| Text | `ink`, `ink-2`, `muted`, `faint` |
| Surfaces | `paper`, `paper-2`, `surface` |
| Rules | `line`, `line-2` |
| Brand | `blue`, `blue-deep`, `blue-wash` |
| States | `won`, `lost`, `void`, `hold`, `gold` (each with a `-bg` pair) |
| Third-party | `telegram`, `whatsapp` — channel glyphs and hover borders only, never a surface |

Three faces do all the work, wired up in `app/layout.tsx` via `next/font`:

- **Oswald** — condensed display face for every heading (`.display-heading`)
- **IBM Plex Sans** — body and UI copy
- **IBM Plex Mono** — the `.eyebrow` label style and the `.num` class used for
  every odd, kick-off time, price and booking code, so columns of figures align

Component classes (`.btn`, `.field`, `.result`, `.eyebrow`, `.rule-double`) are
declared inside `@layer components`. Tailwind orders layers
`theme, base, components, utilities`, so a utility on the element always wins —
`className="btn h-10 min-h-10"` really does produce a shorter button, and
`className="eyebrow eyebrow-blue"` really does come out blue. Keep new
component classes in that layer for the same reason.

Shared building blocks:

- `components/ui/layout.tsx` — `Shell`, `PageMasthead`, `SectionHead`
- `components/ui/article-page.tsx` — the numbered long-form shell used by the legal pages
- `components/brand/wordmark.tsx` — the single source of the logo lockup
- `components/brand/channel-links.tsx` — the Telegram/WhatsApp buttons, shared by
  the homepage, dashboard, footer and mobile menu
- `components/auth/auth-layout.tsx` — the split ink/paper shell for auth screens

### Brand assets

`public/brand/` holds the artwork:

- `smart-tips-mark.png` — the ball-and-arrow mark, cropped to its own edges
  (330x277) so it can be sized by height and fill its box. Used by
  `components/brand/wordmark.tsx` for the header, footer, auth and admin lockups.
- `smart-tips-icon.png` — the mark on a **white** 512x512 square, cropped to the
  artwork. Copied to `app/icon.png` and `app/apple-icon.png` (which drive the
  browser tab and home-screen icons) and to `smart-tips-logo.png` (the
  schema.org organisation logo). These are deliberately opaque, not transparent:
  iOS composites a transparent apple-touch-icon onto black, and a solid tile
  reads on both light and dark browser chrome. It is legible from 32px up; at
  16px the ball detail softens but the silhouette still reads.
- `hero-goal.png` — the masthead photograph, shared by the homepage and the
  member dashboard through `components/ui/hero-plate.tsx`. It runs full-bleed
  behind the headline under a white scrim: 90% on the left where the type sits,
  thinning to 12% on the right so the picture reads properly. Phones take a flat
  72% wash because the headline spans the full width there.

  The scrim is tuned against this photograph. Worst-case contrast anywhere in
  the text band measures **9.4:1 for the headline and 5.2:1 for body copy**,
  against a 4.5:1 AA floor. Both scrims live in `hero-plate.tsx` and nowhere
  else — if you drop in a lighter or busier photograph, re-measure before
  thinning them further.

**Replacing artwork.** The mark and the hero are imported as ES modules, not
referenced by string path, so Next fingerprints them into
`/_next/static/media/<name>.<hash>.png`. Swap the file and the URL changes with
it, which means no browser, CDN or image-optimizer cache can serve the old
picture. The same applies to `app/icon.png` via the file convention. Referencing
these by a literal `/brand/...` path instead would reintroduce exactly that
staleness — the optimizer keys its cache on the URL alone.

Two things to watch when supplying new artwork:

- **Crop out the dead margin.** The mark is sized by height, so any transparent
  padding baked into the canvas shrinks the visible logo. Trim to the artwork,
  then let the layout do the spacing.
- **Keep the alpha channel.** Transparency lets the mark sit on all three paper
  tints unchanged; a white-boxed PNG would need a knockout hack.

`hero-stadium*.png`, `hero-mobile-hd.png`, `smart-tips-lockup.png` and
`smart-tips-wordmark.png` are leftovers from the previous identity and are no
longer referenced; they can be deleted.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- PostgreSQL 15 or newer for database migrations and seeding

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and replace the sample PostgreSQL credentials.

3. Apply migrations and seed the database:

   ```bash 
   npm run db:migrate
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

The homepage build does not query the database, so it can be previewed before PostgreSQL is connected. Database commands require a valid `DATABASE_URL`.

## Environment variables

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server only | For database work | PostgreSQL connection string used by Prisma |
| `NEXT_PUBLIC_APP_URL` | Public | Yes in deployment | Canonical application origin, for example `https://smart-tips.com` |
| `GOOGLE_SITE_VERIFICATION` | Server | Optional | Google Search Console HTML-tag verification token |
| `APP_ENV` | Server only | Optional | One of `development`, `test`, `staging`, or `production` |
| `CRON_SECRET` | Server only | For fixture sync | Long random secret accepted as a Bearer token or `x-cron-secret` header |
| `PAYSTACK_SECRET_KEY` | Server only | For live checkout | Paystack test or live secret key; never expose it to browser code |
| `SEED_ADMIN_EMAIL` | Server only | Optional | Email for the local super-admin created or promoted by the seed |
| `SEED_ADMIN_USERNAME` | Server only | Optional | Username for a newly seeded super-admin |
| `SEED_ADMIN_PASSWORD` | Server only | Optional | Initial password for the seeded super-admin; use a strong local secret |

Never commit `.env` files or expose `DATABASE_URL` to browser code.

## Vercel deployment

Import the GitHub repository into Vercel with the **Next.js** framework preset. Keep the default install and build commands and use Node.js 22, which is pinned in `package.json`.

Add the variables listed above under **Project Settings → Environment Variables**. Production requires `DATABASE_URL`, `NEXT_PUBLIC_APP_URL=https://smart-tips.com`, `APP_ENV=production`, `CRON_SECRET`, and `PAYSTACK_SECRET_KEY` when live checkout is enabled. Use a pooled PostgreSQL URL for application traffic.

Apply database migrations separately with `npm run db:deploy` before promoting a deployment that introduces schema changes. `vercel.json` invokes fixture synchronization at 02:00 UTC and subscription/payment expiration at 03:00 UTC each day; Vercel automatically sends `CRON_SECRET` as its Bearer authorization value.

## Quality checks

Run the complete verification suite:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Project structure

```text
app/
  (public)/          Public route group and homepage
  admin/             Role-protected fixture, prediction, Deck, and user tools
  api/cron/          Protected scheduled sync endpoint
  globals.css        Design tokens and global styles
  layout.tsx         Root metadata and document shell
components/
  brand/             The Smart Tips wordmark lockup
  layout/            Header, desktop nav, mobile sheet, and footer
  ui/                Layout primitives, article shell, buttons, skeletons
lib/
  config/            Product configuration
  db/                Server-only database client factory
  auth/              Password, session, authorization, and audit services
  football/          Provider contract, mock feed, queries, and sync service
  utils/             Shared utilities
  validation/        Zod schemas
prisma/
  schema.prisma      PostgreSQL schema
  seed.ts            Idempotent settings and football-data seed
tests/               Automated tests
```

## Database conventions

- Use Prisma migrations for every schema change.
- Add domain entities only in their designated build stage.
- Store money in integer minor units or `Decimal`, never JavaScript floating-point values.
- Keep generated Prisma files out of source control.
- Seed operations must remain safe to run repeatedly.

## Fixture synchronization

The application uses the mock provider until a licensed football-data integration is configured. It never scrapes sports websites and public/admin reads always come from PostgreSQL.

To apply migrations without granting the application role permission to create shadow databases, use:

```bash
npm run db:deploy
npm run db:seed
```

Trigger the cron-compatible sync for yesterday plus three upcoming days:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-fixtures
```

Pass `?days=7` to sync more upcoming days; the endpoint accepts between 1 and 14.

## VIP pricing and Paystack

The seed creates editable launch defaults in Ghana cedis:

- VIP Day Pass: GHS 10 for one-day, Deck-specific access
- VIP Weekly: GHS 20 for seven days of all-premium access
- VIP Monthly: GHS 50 for 30 days of all-premium access

These are database values, not hardcoded storefront prices. Administrators can edit or deactivate them at `/admin/plans`.

To enable hosted checkout, set `PAYSTACK_SECRET_KEY` and ensure `NEXT_PUBLIC_APP_URL` is the public HTTPS origin. Configure this webhook in the Paystack dashboard:

```text
https://your-domain.example/api/payments/paystack/webhook
```

The callback route verifies transactions again with Paystack before creating an entitlement. Configure a scheduled POST to expire old subscriptions and abandoned payments:

```text
POST /api/cron/expire-subscriptions
Authorization: Bearer <CRON_SECRET>
```

Use Paystack test keys and test payment methods before switching to a live secret. Do not place the secret key in any `NEXT_PUBLIC_` variable.

## Next stage

Stage 5 adds score synchronisation, automatic and manual settlement, admin overrides, audit history, and historical result views. Password-reset tokens are already secure and single-use; delivery will be connected when transactional email is introduced in Stage 8.
