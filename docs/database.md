# Database

HostMyService's own data lives in PostgreSQL, accessed through Prisma.
The schema is `prisma/schema.prisma`.

## Applying schema changes: `prisma db push`

This project syncs the schema with `prisma db push`, not migrations.

```bash
# after editing prisma/schema.prisma
npx prisma db push      # updates the database and regenerates the client
```

Production does the same automatically: both `scripts/webhook-server.mjs` and
`vps-deploy.mjs` run `prisma db push` before building. A deploy that changes
the schema without it fails at runtime with Prisma error `P2022`
("column does not exist").

`db push` refuses changes that would lose data (dropping a column, making a
column required without a default, narrowing a type). For those:

1. Make the change in two steps (add the new column, copy data, then remove
   the old one in a later release), or
2. Apply it by hand with SQL in a maintenance window, then run `db push`.

Don't use `--accept-data-loss` in the deploy pipeline.

`prisma/migrations/` holds three migrations from February 2026 and is far
behind the schema. Don't run `prisma migrate deploy` or `migrate dev` against
production. If you switch to migrations later, create a baseline from the
current schema first (`prisma migrate diff --from-empty --to-schema-datamodel`
plus `prisma migrate resolve --applied`).

## Models

| Model | Purpose | Notes |
|---|---|---|
| `User` | Customers and admins | `role` is `USER` or `ADMIN`. `resetToken` stores a SHA-256 hash. Never return `password` or `resetToken` to the client (`safeUserSelect`) |
| `Plan` | What customers buy | `price` is yearly. `providesDb` + `dbType` decide database provisioning |
| `Payment` | One row per checkout or recurring charge | `status` moves PENDING → SUCCESS once, via `activatePayment()` |
| `Subscription` | Paid access to a plan | `endDate` enforced by the daily cron for subscriptions created on or after `EXPIRY_ENFORCEMENT_START`. `razorpaySubscriptionId` for auto-renew |
| `Site` | A customer domain | See fields below |
| `Deployment` | One deploy attempt | `type` ZIP or GIT; `status` PENDING → BUILDING → DEPLOYED / FAILED |
| `DeploymentLog` | Step-by-step deploy output | Shown to the customer |
| `Affiliate` | Approved (or applying) referrers | `code` used in `/r/<code>`; see [affiliate-program.md](affiliate-program.md) |
| `Commission` | One per referred payment | Money in paise. Unique `paymentId` |
| `Payout` | A payout request and its result | `REQUESTED` → `PAID` (with reference) or `REJECTED` |
| `AffiliateSettings` | Single row, id `default` | Created with defaults on first use |

`Site` fields worth knowing:

| Field | Meaning |
|---|---|
| `domain` | Unique hostname. New ones validated with `hostnameSchema`; stored ones re-checked with `domainSchema` |
| `status` / `suspendReason` | `SUSPENDED` with reason `EXPIRED` (cron) or `ADMIN` (manual) |
| `appPort` | Port of the site's Node.js app, reused across redeploys. Unique |
| `runAsSiteUser` | Build and run as the site's own Linux user. `true` for new sites, `false` for sites created before November 2026 |
| `dbConnection` | Connection string of the site's database, set once at first provisioning |
| `envVars` | The customer's `.env` content |
| `serverPath`, `serverIp` | Set after the first successful deploy |

Most tables have `deletedAt` for soft deletes; queries filter `deletedAt: null`.

## Seeding

`prisma/seed.ts` creates one admin (from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`) and three sample plans. Never add real users or
production data to it.
