# Winning Tips launch handoff

Launch target: the owner's existing https://winning-tips.vercel.app deployment, followed by winning-tips.org when the correct owning project is connected.

## Implemented in this checkout

- Ghana VIP prices are assigned automatically when a slip is imported: VIP1 GHS 40–50, VIP2 GHS 80–100, VIP3 GHS 170–200.
- Until 30 eligible complete slips exist in that tier's last 90 days, imports use the floor: GHS 40 / 80 / 170. After that, a 95% Wilson lower bound of recorded whole-slip wins scales prices between the floor (bound <=50%) and ceiling (bound >=80%), rounded to whole cedis. This is a conservative historical pricing rule, not a prediction of the new slip's accuracy. It is not a calibrated sports model.
- Only pre-kickoff published, fully won/lost, non-demo cards enter that calculation. Replaced/deleted cards remain eligible; removing a card does not remove its loss from the pricing sample. Stored results still require accurate operator grading. Model-based selection and automatic independent result validation are separate work.
- New VIP slips start closed for operator review. Their date comes from the first kickoff; their deadline is the earlier of the first kickoff and the provider expiry. Games Control can load tomorrow's cards and shows the card's own price/state.
- Checkout refuses missing/expired deadlines, started/settling/demo cards, changed card or price quotes, and already-owned cards. Concurrent pending orders for the same customer/card are prevented within a transaction.
- Refunds cannot be undone by a late successful callback. Late failed verification cannot downgrade a successful payment.
- Pending verification shows a retry option and tells the member not to pay twice. Payment buttons are disabled while the gateway key is absent.
- Settlement reads market parameters from each prediction's sourceData rather than from its shared fixture. This needs migration `20260914170000_prediction_source_data`.
- Scheduled publication excludes started, mock and inactive/deleted card records.
- Password reset can deliver via Resend with RESEND_API_KEY and a verified EMAIL_FROM. Without those, the form reports recovery unavailable instead of claiming an email was sent. API contract: https://resend.com/docs/api-reference/emails/send-email
- Migration and seed npm commands check the configured target against the two local client projects; demo seeding is restricted to development.

## Deployment access and resources

At inspection, Winning Tips' local database settings matched Smart Tips. No migrations, seeds or application writes were run against that database.

Before the owner identified the existing public deployment, a separate empty `winning-tips` project was created in the connected `adjekwaboat-4998s-projects` team. At the owner's request, that exact empty project was deleted after verifying it had no deployments; the API confirmed 404 afterward. Its local .vercel/project.json link was removed. Its temporary domain assignment and production settings are no longer the intended deployment configuration. The existing deployment belongs to the owner's `aboat` account/team and needs that login.

Free Neon provisioning did not create a database: it stopped for the owner's marketplace terms acceptance. Provisioning was paused when the owner requested use of the existing deployment. Inspect that deployment's existing database and account before creating any more resources. Recheck winning-tips.org domain availability in the correct account before assigning it.

## Release sequence once the correct project is accessible

1. Link the checkout to the owning Vercel project. Inspect production environment metadata without printing keys. Confirm database isolation from Tips Deck and Smart Tips.
2. Provision the dedicated database if the existing Winning Tips deployment has none; use a persistent resource, not an expiring test database. Set DATABASE_URL for runtime and DIRECT_URL for migrations when the provider supplies both.
3. Run `npm run db:deploy`, then configuration-only `npm run db:seed` with SEED_DEMO_DATA=false. Bootstrap only the owner's super-admin identity; do not import client users or predictions.
4. Run tests, lint, typecheck and production build on the final source, then deploy to the confirmed project. Verify public routes, registration/login, admin authorization and empty states on the deployed build.
5. Configure Winning Tips' Paystack key and `/api/payments/paystack/webhook`; verify a test-mode payment, exact-card access, duplicate callback and refund behavior before enabling live payments. No live transaction was performed during this work.
6. Configure password recovery sender and a working customer-support contact. Confirm existing community links belong to Winning Tips.
7. Load launch-day Free/VIP1/VIP2/VIP3 slips, review matches/prices/deadlines, and open the intended cards. Slips and the selection method have not been supplied in this task.
8. Configure a licensed sports-data feed if automated results are required. The existing API-Sports importer creates its own fixture IDs; SportyBet fixtures need explicit trustworthy mapping before their scores can be synchronized. Until then use reviewed manual settlement. Do not describe feed synchronization alone as automated SportyBet settlement.

The app cannot accept sales until the correct deployment, isolated schema, gateway key and actual daily cards are in place. No unattended monitoring or automatic pick-generation model was added in this launch pass.
