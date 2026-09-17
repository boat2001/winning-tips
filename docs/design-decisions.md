# Design decisions

Required by `WINNING_TIPS_DEVELOPMENT_GUIDE.md` §13.2 and §21.11. Every deliberate
deviation from a mock or from the guide is recorded here with its reason, so a
reviewer never has to guess whether a difference was intentional.

Newest first.

---

## 2026-09-14 — Daily cards, more sports, country editions and automation

**Authority:** product-owner instruction (level 1, §1): VIP purchases are
one-time daily purchases like tips-deck.com, never monthly plans; add other
sports and country expansion; automate it. Approved as six items: make the
daily card the product, fix the membership badge, retire subscriptions, add
sports, add countries, automate the daily cycle.

### 1–3. The daily card is the product

Checkout already sold one day's booking; the subscription layer around it was
dead code. No code ever created a subscription, so every signed-in member showed
as Free, the admin Subscriptions screen was permanently empty, and the expiry job
expired nothing.

- The card (`Booking`) now carries `currency` and `isSoldOut` beside its price and
  deadline, and checkout reads only the card. Sales close at the deadline.
- `Subscription`, `SubscriptionStatus`, `PlanScope`, `Plan.durationDays`,
  `Plan.scope` and `User.premiumAccessUntil` are dropped. `Payment.planId` is
  nullable; historic payments keep theirs.
- A member is Premium exactly while they own a card for today.
- A refund just marks the payment refunded: every unlock requires a successful
  payment, so the card is withdrawn with it.
- Migration `20260914090000_daily_card_purchases`.

### 4. Sports

- `League.sport` (FOOTBALL, BASKETBALL, TENNIS); fixtures inherit it. Migration
  `20260914100000_league_sport` backfills FOOTBALL, which every existing row is.
- The SportyBet loader files each leg under its real sport and **refuses a slip
  with a virtual, e-sports or look-alike leg** ("eFootball", "Table Tennis"),
  per §2.
- API-Basketball adapter, off by default. It follows the documented payload and
  is covered by tests against it, but has not yet run against the live API.
- **No tennis feed.** API-Sports does not cover tennis, so tennis resolves to a
  plain refusal rather than an invented integration. Tennis legs still publish
  through SportyBet slips.

### 5. Country editions

- `Booking.countryCode`: a card is per country, per day, per tier. Migration
  `20260914110000_card_country` backfills GH.
- Each edition in `lib/config/countries.ts` carries its SportyBet site and a
  payments flag. Members choose an edition in Preferences and see and buy only
  its cards, in its currency. A disabled edition falls back to the launch
  edition rather than showing an empty store.
- A tier's default price is copied only onto cards in the same currency, so a
  cedi price never lands on a naira card. Nigeria is configured and off.

### 6. Automation

- Settlement engine (`lib/results/settlement.ts`): grades only markets a final
  score settles with certainty, returns null for the rest, and never overwrites
  a result an admin set.
- Publishing: the SCHEDULED status existed and nothing acted on it.
- Telegram digest: results with losses listed, today's free card, no urgency
  language; skipped without credentials.
- `AutomationRun` log and `/admin/automation`. Migration
  `20260914120000_automation_runs`.
- Cache expiry from cron routes uses `revalidateTag(tag, { expire: 0 })`:
  `updateTag` is only allowed in Server Actions in this Next version.
- All schedules are daily, to fit Vercel Hobby's one-run-per-day cron limit.

### Deploy order

Apply all four migrations with `npm run db:deploy` **before** this code ships.
Three of them drop or add columns the new code reads.

**Verification:** typecheck, lint, 166 tests, and a production build.

**Local build note:** a stale `.next/types` folder, left by an old production
build and not used by the dev server, still listed the deleted subscriptions
route and failed the build's type check. It was removed; any `next build` into
`.next` regenerates it.

---

## 2026-09-14 — The profile edits itself, and preferences line up

**Authority:** product-owner instruction (level 1, §1): *"change my name to Sport
Guru, and the tag name to @betterdaysahead … structure and align the preferences
section well … make every part functional."*

**Identity is editable in place.** `components/app/identity-panel.tsx` replaces
the static identity card. "Edit Profile" and the badge on the avatar both open
a form for the two fields the card shows — display name and handle — instead of
linking to the legacy account page, which dropped the member into a different
design system to change a name. `updateIdentity` writes both fields and the
audit row in one transaction, refuses handles reserved for staff, and turns the
unique-index violation into "that handle is already taken" rather than a crash.
The handle reuses the registration rule, so a handle that could never have been
registered cannot be switched to later either.

**The preview identity is now Sport Guru / @betterdaysahead.** That is
`lib/fixtures/viewer.fixture.ts`, the demo member every design-preview screen
renders. The account in the database was **not** renamed — see below.

**Preferences rows share one grid.** Icon, label and control are three columns,
and the control column sizes to its content, so the three sport chips stay on
one line instead of wrapping under a fixed cap. Below 640px the control drops
beneath its label and lines up with it rather than being squeezed beside it.

**Sign out everywhere.** `signOutOtherDevices` existed and nothing called it. It
is now a row in the Account card, typed so it can report a failure, and guarded
in the preview.

**The appearance switch still says "always on".** The only theme that exists is
the stadium dark one. A working toggle needs a complete light palette for both
the navy and card surfaces — a second design system, not a switch — so it keeps
reporting reality instead of becoming a control that does nothing. This is the
one part of the profile screen that is not functional, and it is deliberate.

**Documentation fix found while auditing automation:** the README described
`/api/cron/sync-fixtures?days=` as accepting 1 to 14. The route clamps to 7.

**Not done from this instruction: the live account's name.** Renaming a row in
the production database is a change to real data on an account that cannot be
identified from here, so the screen was made to do it instead: sign in, then
Profile → Edit Profile.

**Verification:** typecheck, lint, 123 tests, and no overflow or console errors
at 1440, 834 and 390px.

---

## 2026-09-14 — Vertical rhythm: two spacing steps instead of one

**Authority:** product-owner instruction (level 1, §1): *"give in some vertical
breathing spaces to the sections on the pages."*

Every screen stacked its sections at a flat 16-20px, the same distance used
*inside* a section between a heading and its content. With no difference
between the two, a page of full-width cards read as one unbroken column and
nothing marked where one idea ended and the next began.

Two classes in `app/globals.css` now carry the rhythm, and every app page uses
them instead of a one-off `gap-4` / `space-y-3`:

| | Gap | Where |
|---|---|---|
| `.page-stack` | `clamp(1.5rem, 2.6vw, 2.5rem)` | between the sections of a screen |
| `.section-stack` | `clamp(0.875rem, 1.1vw, 1.125rem)` | between a section heading and its content |

The section gap is always the larger of the two, so a section reads as one
object. Both scale with the viewport: a phone keeps 24px, where a desktop's
40px would waste a screen the reader has to scroll.

Also widened: the home and community column gaps, the landing band padding,
and the inner padding of section panels from `sm` up — an interior that stayed
tight while the space around it grew made the panels look cramped.

**Verification:** typecheck, lint, 119 tests, and no overflow or console
errors at 1440, 834 and 390px across all mocked routes.

---

## 2026-09-11 — Registration records consent; age is its own acknowledgement

**Guide reference:** §8 (Consent, AgeGateRecord), §14.2, §14.8 (consent
history), §20 foundation step 3.

**Before:** one checkbox read "I am 18 or over and accept the Terms of Service
and Privacy Policy". Nothing was stored: not the version agreed to, not when,
not for which country.

**Now:**

- Two unchecked boxes, one for age and one for terms and privacy.
  Registration validates each separately.
- `ConsentRecord` rows are append-only. Registration writes three rows in the
  same statement as the user: `AGE_CONFIRMATION` (version `18+`), `TERMS` and
  `PRIVACY`. The last two carry the document version.
- Document versions live in `lib/config/legal.ts`. The terms and privacy pages
  render their "updated" date from the same entry, so the page and the record
  cannot disagree.
- `minimumUserAge` is part of the country configuration. It is 18 for Ghana
  and Nigeria, the conservative default already in use. The regulator-approved
  value is still an owner decision (§22).
- Marketing consent is never written at sign-up, because it is never
  pre-checked.

**Deploy order matters.** Migration `20260911090000_consent_records` must be
applied (`npm run db:deploy`) **before** this code ships. Otherwise every new
registration fails on the missing table. The migration only adds a table and
an enum, so it is safe to apply ahead of the code.

**Not yet built:** showing consent history on the profile, and re-prompting
members when a document version changes.

---

## 2026-09-11 — Mocks are structure, not pixel spec: UX polish pass

**Authority:** product-owner instruction (level 1, §1): *"use the designs as
layouts and frameworks or structures, and then polish them for a good UI/UX."*
This supersedes §13.6 ("do not redesign an approved mock") for layout detail.
The mocks still set the **structure**: navigation, section order, card types,
colour system and imagery. Geometry, density and control placement may now
change wherever they help usability. It also approves the 2026-09-10 editorial
pass, which had been waiting on product-owner review.

### Defects fixed

| Screen | Problem | Change |
|---|---|---|
| Home | The grid still held an area for the removed Telegram card, leaving a hole the height of the pick list in the right column. | Picks beside a stacked sport list from 1200px; single column below. |
| Tip rows | The list labelled the selection "Market", so rows read "Market: Yes". Home rows showed a bare "Yes". | The market is the label and the selection is the value. Compact rows use `pickText()`, giving "Both Teams to Score: Yes". |
| Tip rows, phone | Positional CSS (`> div:nth-child(2)`) broke as children changed. The sport icon overlapped the card corner and rows ran to five stacked blocks. | Rebuilt on named grid areas. The phone list row is fixture, a hairline, then pick, confidence and price on one line. 61 positional override lines deleted. |
| Stat tiles | "Won" and "Lost" labels on navy used card ink, which is near-invisible. | `StatTile` takes a `surface` prop that sets label and value shades. |
| Section headers | The action link wrapped under the title on phones. | Title and action stay on one line. |
| Results | The status filter was a column of five tall buttons beside the chart, which it never changed. The axis skipped values ("3, 2, 0, -1") and its labels were spaced evenly while gridlines were not. | Filter chips with counts sit in the Recent Results header. Ticks use whole-number steps placed at their gridlines. |
| Community | Posts had four stacked control rows. The timestamp was a raw locale string. The rail cards were two ragged columns, squeezed two-up on phones. | One action row: like, replies, share, and report behind an icon. Relative times. A composer that looks like a field. Feed plus one sticky rail from 1024px, single column below. |
| Profile | A preferences form with bare checkboxes sat inside the navigation list, with its save button and outage message mid-list. | Its own Preferences card: sport chips, a real switch, one footer with status and save. The Account list follows. |
| Landing | The page ended at the hero. | Sections per §14.1: today's real picks, how it works, the graded record (or an honest "not started yet"), sports, community channels, FAQ, and a responsible-participation note. No invented figures. |

**Not added to the landing page:** a pricing section. Prices need owner
approval (§22), so the FAQ links to the existing `/pricing` page.

**Local preview:** `DESIGN_PREVIEW=true` with `NEXT_DIST_DIR=.next-preview`
runs a fixture-only dev server beside the normal one without touching any
database. `.next-preview/` is git- and lint-ignored.

**Verification:** typecheck, lint, 117 tests, and no overflow or console
errors at 1440, 834 and 390px across all mocked routes.

---

## 2026-09-10 — Editorial pass: removing what the mock over-applied

**Guide reference:** §13.6 (do not redesign an approved mock) — knowingly
departed from, and why; §14.1 (no fabricated claims); §21.12 (use the
conservative documented default and record it).

The mocks give every screen landing-page treatment: stadium photograph, athlete
cut-out, handwritten slogan, three-beat tagline. Reproducing that faithfully on
five interior screens produced a product that read as generated rather than
designed. This pass keeps the visual system and removes the repetition.

### What the audit found

- **Five triadic slogans**, with "Win together" three times and "Bigger wins"
  twice. By the fifth the words were wallpaper.
- **The same photo hero on six screens**, each spending ~200px of vertical space
  above the content the member opened the app to read.
- **The Telegram promo three times**; the brand promo card three times
  (sidebar, home grid, profile).
- **The featured tip repeated** as row one of the list directly beneath it.
- **"Last 7 Days" four times** on the results screen.
- **Two result counts** on Tips, a few pixels apart.

### The structural change

`components/app/page-header.tsx` replaces `PageHero` on Tips, Results,
Community, Profile, Notifications and Saved tips. It names the screen, states a
**fact** — a count, a date range, a status — and holds that screen's controls.

`PageHero` now appears on Home alone, where arriving is the event and a welcome
is earned. The landing page keeps its own full composition.

**This is a deliberate departure from the approved mocks** and needs
product-owner review. It is reversible per screen.

### Claims withdrawn

| Removed | Why |
|---|---|
| "High Confidence" filter and section | Filtered on `confidenceBand`, which is null for every published tip because no model exists. The chip was always shown and always returned nothing. |
| "Our most trusted tips, with the highest model probability" | There is no model probability. |
| "Active Rooms" + online counts | Implied live presence that is not measured. Now "Browse by sport", which is what it does. |
| Community section cards | Anchor links to content already on the page; two advertised features that render "coming soon"; and a second placement for Telegram. |
| Odds column on Results | Rendered a column of em-dashes. An empty column reads as broken data rather than absent data, so it is dropped until a price exists. |
| "Keep Going!" on an empty record | Encouragement with nothing to encourage. Appears once there are graded results. |

### Copy that now carries information

Page subtitles state the day and what is on it — "Thursday 10 September · 3
predictions published" — rather than motivation. The one place the product
speaks with feeling is the results footnote, which now leads with the promise it
had been burying in grey 12px type:

> **Every prediction we publish stays on this page, won or lost.**

That is the honest claim this product can actually make, and trust is the
emotional connection a prediction service lives on. The methodology follows it.

### Also fixed

Mobile home: the athlete cut-out reached across the greeting; the seven-day
strip was squeezed into ~130px so its weekday labels collided; the development
badge sat on top of the hero kicker.

**Verification:** typecheck, lint, 112 tests, build, and no overflow across 88
width × route combinations.

---

## 2026-09-09 — Typography floor and layout polish pass

**Guide reference:** §11 (spacing/type scale), §12 (responsive foundations),
§13.5 (visual validation), §16 (legibility at 200% zoom).

### The 11px type floor

`app/globals.css` carried **30 font-size declarations between 7px and 10px**,
plus five sub-11px Tailwind arbitrary values in components. Each had been added
to squeeze a row into a narrow breakpoint. That is a layout fix applied to the
wrong property: it costs legibility, fails a zoom check, and was the single
biggest reason the UI read as unfinished.

All of them now sit at or above **11px**, and the component layer carries a note
saying so. Where content then failed to fit, the layout changed — not the type.

### Measured against the mock rather than estimated

`scripts/compare-mock.mjs` stacks a band of the approved desktop mock directly
above the same band of our screenshot, both scaled to 1440. Stacking rather than
placing side by side is deliberate: two type scales separated by 1400px of
horizontal distance cannot be judged by eye, but the same band with baselines a
few pixels apart makes a 2px difference obvious.

Comparing identical strings at the reference width established that our type was
**smaller** than the mock's, not larger — "Today's Top Picks" measured 206px
against 226px. The problem was never size; it was *rhythm*. Tip rows stood at
92px against the mock's 72px because the three text lines inherited a 1.6 line
height, and that surplus compounded down the page. Tightened to 79px.

### Fixed

| | |
|---|---|
| Mobile landing | Artwork was positioned absolutely **over** the copy, running the lede under an athlete photograph and pushing both float cards off-screen. Now stacks in flow, with the composition sized by aspect ratio instead of a magic pixel height. |
| Marketing header | Brand tagline was 9px; CTA wrapped to two lines, then overflowed 30px once it could not. Tagline at the floor, compact CTA on phones, tagline deferred to 430px. |
| Sidebar lockup | Mark was 40px against the mock's ~56px. |
| Hero stat row | Occupied 65% of the hero against the mock's ~46%, crowding the athlete artwork. Now 52%. |
| Tablet tip rows | The meta wrapped to a full-width second row, leaving the kick-off bottom-left and the price bottom-right with dead space between. Rows were ~130px; now ~104px and uniform. |
| Tablet home | Right column left a gap beneath the Telegram card. |
| Mobile results | Performance breakdown was four cards across a 358px screen with every label on three lines; status pills were a ragged 3+2 that clipped. Both two-up on phones. |
| Mobile tips | Price stacked under the confidence chip at 10px. Now a four-column row matching `mobile/tips.png`, with the price in its own column. |

**Verification:** typecheck, lint, 113 tests, build, and no overflow across 88
width × route combinations (320–1920px).

**Left alone:** the admin screens still carry four sub-11px values. They belong
to the legacy newsprint system, which is out of scope for this pass and retires
with the VIP-slip routes.

---

## 2026-09-08 — Mock-fidelity pass over the member screens

**Guide reference:** §13.5 (visual validation loop), §13.6 (do not redesign an
approved mock), §21.8 (never fabricate).

The screens had drifted from `design-reference/` while they were rewired to real
data. This pass compared each one against its mock at 1440 / 834 / 390 and
brought the layout back, without reintroducing figures the domain cannot supply.

**Restored to the mock**

- Profile identity: gold Premium chip, edit badge on the avatar, location line,
  and the four-up icon stat row.
- Profile: the "Keep Going!" script flourish beside the form bars, and the
  Appearance row as a switch rather than a text value.
- Results: pill range chips with a calendar icon on the active one, and the
  date-window readout beside them.
- Results chart: y-axis labels, hairline gridlines, an emphasised zero line, and
  red markers on losing days — all of which a rewrite had dropped.
- Community: the second line on each of the four section cards, the topic chip
  on a post, and the "Active Rooms" heading.

**Deliberately not restored**

| Mock element | Why not |
|---|---|
| Profile "248 Picks Followed", "7 Days Current Streak", "12 Referrals" | No source in the domain. The four-up row keeps the mock's shape and carries counts that are real: saved tips, graded tips, favourite sport, plan. |
| Home "87% Accuracy · +12% this month", "+1,240 Happy Winners" | Fabricated social proof, which §14.1 forbids outright. The three-card shape is kept with real figures. |
| Results "+12.54 Units" in the chart header | Units are not published without an approved staking method (§22). |
| Top Members leaderboard, Today's Challenge | No schema. Both render an honest empty state in the mock's panel geometry. |
| Invite banner "Earn Rewards / premium rewards" | Promises a rewards programme that does not exist. |

**Two defects found by the comparison**

- Checkboxes on the white settings card rendered as filled black squares: they
  inherited `color-scheme: dark` from `.app-shell`. Native controls on a light
  surface now get `color-scheme: light`.
- The invite banner squeezed its copy into a five-line column on a 390px screen.
  It stacks below `sm`.

**Also removed:** `components/predictions/performance-chart.tsx`, orphaned when
the results screen moved to `ResultsChart`.

---

## 2026-09-07 — Sport marks drawn as SVG, not cropped from the ball photographs

> **Superseded 2026-09-17:** the owner asked for real ball icons. The marks are
> now the MIT-licensed Fluent Emoji 3D soccer ball, basketball and tennis ball
> (`public/assets/sports/{football,basketball,tennis}.webp`). `balls.webp` is
> still used uncropped as landing decoration.

**Guide reference:** §13.6 (do not substitute assets), §15 (never crop or
distort supplied artwork without approval).

**Decision:** `components/ui/sport-icon.tsx` draws the football, basketball and
tennis marks as SVG.

**Reason:** The mocks show photographic balls in tinted circular tiles. The three
balls in `balls.png` overlap in a single cluster, so separating them cleanly
would mean retouching the owner's artwork. Drawing them keeps the mock's colour
coding (white football, orange basketball, yellow-green tennis), stays crisp at
the 24-28px they actually render, and adds no image weight to a page that shows
a dozen of them.

**Revisit when:** the owner supplies three separate ball cut-outs.

---

## 2026-09-07 — Sport filter ~~is a chip row~~ **RESOLVED: matches the mock**

**Guide reference:** §14.4 (filters serialize to URL state), §13.6 (do not
redesign an approved mock).

**Original decision (superseded):** the sport filter rendered as a chip row
because a dropdown that kept filter state in the URL needed either JavaScript or
a `<details>` panel, and the surrounding filter row scrolls horizontally, which
clips an absolutely positioned panel.

**Current state:** `components/predictions/sport-filter.tsx` is a native
`<select>` matching the mock's "All Sports ⌄" control. It still serialises to the
URL — the change handler routes through `tipFilterHref` — so a filtered view
stays shareable and refresh-safe. The clipping problem does not arise because a
native select popup is painted by the browser, not inside the scroll container.

**Residual trade-off:** it is a client component with an `onChange` handler, so
the sport filter needs JavaScript. The window filters beside it are still links
and work without it. Acceptable, and recorded rather than left to be discovered.

---

## 2026-09-07 — The legacy homepage moved to /classic

**Decision:** `app/(public)/page.tsx` became `app/(public)/classic/page.tsx`,
marked `noindex` with its canonical set to `/classic`. `/` now serves the new
landing page from `app/(marketing)/`.

**Reason:** Both routes cannot own `/`, and the new landing is the approved
design for that slot. Moving rather than deleting keeps the old page reachable
and reviewable while both prediction systems run side by side.

**Open:** delete `/classic` once the VIP-slip product is retired. It is not
linked from any navigation.

---

## 2026-09-07 — Unauthenticated visitors see the fixture viewer inside the app shell

**Guide reference:** §21.8 (demo content must be visibly isolated).

**Decision:** `lib/app/current-viewer.ts` maps a signed-in member from their
real record, and falls back to `fixtureViewer` otherwise.

**Reason:** The five app screens all assume a signed-in member, and the new
domain has no auth guard yet. The fallback keeps them reviewable. Every screen
inside the shell renders the demo-data notice, so a fixture identity is never
presented as a real one.

**Replace with:** a redirect to `/login` when the auth guard lands. This is the
single most important item to close before any public deployment of these
routes.

---

## 2026-09-07 — The dark-mode switch reports reality instead of pretending

**Decision:** The profile settings list renders the Dark Mode row from the mock,
but the switch is `aria-disabled` and labelled "always on".

**Reason:** There is only a dark theme today. A working-looking toggle that does
nothing is worse than an honest one.

---

## 2026-09-07 — `cn()` concatenates; it does not merge Tailwind classes

**Not a design decision — a trap worth writing down.**

`lib/utils/cn.ts` joins strings. It has no `tailwind-merge`, so passing
`className="hidden"` to a component whose base class already sets `inline-flex`
does **not** hide it: both land in the class attribute and Tailwind's own
utility ordering decides the winner, not the order they were written.

This shipped a clipped "Get Started" button on the landing header at mobile
widths. `html { overflow-x: clip }` in the legacy stylesheet meant it produced no
page scroll, so a `scrollWidth > clientWidth` check saw nothing.

**Rule:** to hide a component responsively, wrap it —
`<span className="hidden sm:block"><ButtonLink … /></span>` — or add
`tailwind-merge`. `scripts/capture-screens.mjs` now measures element boxes
against the viewport instead of page scroll width, and skips anything inside a
scrollable rail.

---

## 2026-09-07 — Repository stays a single Next.js app

**Guide reference:** §7 (repository convention prescribes a pnpm monorepo with
`apps/web`, `apps/worker`, `packages/*`).

**Decision:** Keep the existing single Next.js application. Enforce the guide's
*boundaries* through directory structure instead of workspace packages.

**Reason:** Product-owner instruction (authority level 1, §1). A monorepo
migration rewrites the build, CI and Vercel deployment before a single pixel
changes, and the guide's own framing is "the exact vendors may change, but
preserve the boundaries".

**How the boundaries are preserved:**

- domain logic in `lib/` never imports from `app/`;
- each `lib/` module exposes one entry point, no cross-feature deep imports;
- provider payloads are normalised at the module edge.

**Revisit when:** a background worker is needed for the automation pipeline
(§10). Queues cannot run inside Vercel request handlers, so that is the point
where `apps/worker` earns its keep.

---

## 2026-09-07 — Both prediction systems run side by side

**Guide reference:** §8 (domain model), §14 (screens).

**Decision:** The new tip model (`PublishedTip`, confidence bands, grading)
is built alongside the existing VIP-slip / deck / booking-code domain rather
than replacing it. Both remain visible in admin.

**Reason:** Product-owner instruction. The VIP-slip flow carries live Paystack
revenue and cannot be interrupted.

**Consequence:** Two prediction pipelines and two result paths exist during the
transition. This is deliberate, not drift. Anything reading "predictions" must
state which system it means.

---

## 2026-09-07 — Screens render from typed fixtures during the build-out

**Guide reference:** §13.4 (data cards render from typed fixtures or API data),
§21.8 (seeded demo content must be visibly and structurally isolated from
production).

**Decision:** New screens render from typed fixtures in `lib/fixtures/`, using
the same types the real queries will return.

**Isolation guarantees:**

- fixtures live under `lib/fixtures/` and are never imported by a production
  data path;
- every screen inside the app shell renders a demo-data notice, in **all**
  environments including production — the point is that fabricated figures can
  never be mistaken for real ones, and hiding the warning where it matters most
  would defeat it;
- the notice is driven by the `isFixtureBacked` constant, which disappears when
  the last fixture import does, rather than by an environment variable that
  could be set wrongly;
- fixture modules carry the same exported types as the eventual queries, so
  swapping the source is a one-line change per screen.

**Reason:** The mocks assume a signed-in member with real history. Community and
challenges have no schema yet. Fixtures let the layouts be built and validated
faithfully now without fabricating production claims (§21.8, §13.6).

---

## 2026-09-07 — Design tokens sampled from the mocks, not taken from §11

**Guide reference:** §11 — "Treat these as initial tokens; sample the supplied
mocks and update the token file if their exact approved values differ."

**Decision:** Token values are sampled from the approved mocks. Where a sampled
value differs from the §11 starting value, the sampled value wins.

| Token | Guide §11 | Sampled from mocks | Source |
|---|---|---|---|
| `navy-950` | `#02152f` | `#00142e` | sidebar ground, desktop/home |
| `navy-900` | `#03204a` | `#001938` | page ground, desktop/home |
| `navy-850` | — | `#001b42` | top bar, desktop/home |
| `navy-800` | `#07336b` | `#00203e` | panel ground, desktop/results |
| `navy-700` | — | `#012b57` | inactive filter pill, desktop/results |
| `blue-500` | `#0878ff` | `#0063fe` | active filter pill, desktop/results |
| `blue-400` | `#20a4ff` | `#0097fe` | Telegram card, desktop/home |
| `green-500` | `#18e85d` | `#00c437` | odds pill / WON badge |
| `green-400` | `#4bff72` | `#3cf980` | chart line and bars |
| `red-500` | `#ff4757` | `#f73549` | lost bars, LOST badge |

Sampling method: modal colour of a 10×10 patch inside each fill, which avoids
antialiasing at edges and text. Single-pixel reads were discarded as unreliable.

`gold` retains the §11 value `#ffc629`; the premium chip in `desktop/profile.png`
is small and sits on a gradient, so no clean patch was available.

---

## 2026-09-07 — Mock references relocated to `design-reference/`

**Guide reference:** §13.1.

**Decision:** The product owner's `mockups/` directory was migrated to
`design-reference/` with the guide's slug naming (`desktop/home.png`, not
`desktop/desktop-home.png`), and `manifest.json` was created.

Guest-home mocks map to the `landing` slug across all three viewports.
Loose artwork moved to `design-reference/shared/source-assets/` — originals are
kept out of the public build per §15.

---

## 2026-09-07 — Development guide stays at the repository root

**Guide reference:** §7 places it at `docs/WINNING_TIPS_DEVELOPMENT_GUIDE.md`.

**Decision:** Left at the root as `WINNING_TIPS_DEVELOPMENT_GUIDE.md`.

**Reason:** That path is part of the monorepo convention already set aside
above, and the root location is where the product owner put it and refers to it.
No functional difference.

---

## Open — awaiting product-owner decision

Items the guide (§22) says must not be guessed. None of these block the current
screen work; each is listed with the conservative default in use meanwhile.

| Item | Default in use | Guide ref |
|---|---|---|
| Brand font licence | Poppins-family stack via next/font, matching the mock letterforms | §11, §22 |
| Public performance formula and unit-staking assumptions | Figures shown are fixture data, marked as such; no production claim rendered | §14.6, §22 |
| Production plan prices | Existing plan rows unchanged | §22 |
| Operator enablement and affiliate terms | No operator enabled; no outbound redirect implemented | §6, §22 |
| Minimum age per jurisdiction | Existing 18+ notice retained | §22 |
| `tip-detail` layout | No mock supplied; derived from listing card language and §14.5 | §13.3 |
