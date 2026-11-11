# Environment variables

All values live in `.env` (template: `.env.example`). Variables marked
**required** are checked by `lib/env.ts` at startup; the app won't start without them.

## Core

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string for HostMyService's own database |
| `NEXTAUTH_SECRET` | yes | Signs session tokens. `openssl rand -base64 32`. Changing it logs everyone out |
| `NEXTAUTH_URL` | production | Public URL of the app, e.g. `https://hostmyservice.in`. Used in password-reset links |

## VPS (customer deployments)

| Variable | Required | Description |
|---|---|---|
| `VPS_HOST` | for deploys | IP address of the VPS |
| `VPS_USER` | for deploys | SSH user, normally `root` |
| `VPS_PRIVATE_KEY` | for deploys | Private key without a passphrase, newlines written as `\n`. Set it with `node scripts/set-vps-key.mjs <key-file>` |
| `DEPLOY_RUN_AS_ROOT` | no | `true` disables per-site users for every site and runs customer code as `VPS_USER`. Emergency use only, see [deployment-pipeline.md](deployment-pipeline.md#isolation) |
| `EXPIRY_ENFORCEMENT_START` | no | ISO date-time. Subscriptions created before it are never expired automatically. Default `2026-11-12T00:00:00Z` |

## Razorpay

| Variable | Required | Description |
|---|---|---|
| `RAZORPAY_KEY_ID` | yes | API key ID (`rzp_live_…` or `rzp_test_…`) |
| `RAZORPAY_KEY_SECRET` | yes | API key secret. Verifies checkout signatures |
| `RAZORPAY_WEBHOOK_SECRET` | recommended | Secret from Dashboard → Webhooks. Falls back to `RAZORPAY_KEY_SECRET` |

## Email

| Variable | Required | Description |
|---|---|---|
| `SMTP_EMAIL` | for email | Gmail address that sends password-reset and site-live emails |
| `SMTP_PASSWORD` | for email | Gmail app password (not the account password) |
| `ADMIN_EMAIL` | no | Email registered with Let's Encrypt. Default `admin@hostmyservice.in` |

## Maintenance and CI/CD

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | for cron | At least 16 characters. `openssl rand -hex 32`. Without it `/api/cron/maintenance` returns 503 |
| `WEBHOOK_SECRET` | for CI/CD | GitHub webhook secret. Without it the webhook server rejects every request |
| `WEBHOOK_PORT` | no | Webhook server port. Default `9000` |
| `DEPLOY_BRANCH` | no | Branch that triggers a deploy. Default `main` |
| `PROJECT_DIR` | no | Where HostMyService is checked out. Default `/var/www/hostmyservice` |

## Google Drive backup of uploads (optional)

Uploaded ZIPs are also stored in Google Drive so admins can download them
after the local copy is cleaned up.

| Variable | Description |
|---|---|
| `GOOGLE_DRIVE_FOLDER_ID` | Drive folder for archives |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | OAuth credentials. Get the refresh token with `node scripts/get-refresh-token.js` |
| `GOOGLE_OAUTH_CREDENTIALS_PATH` | Path to an OAuth client JSON, used when the three variables above are not set. Default `./oauth-credentials.json` (git-ignored) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Alternative: service-account key file |

## Seeding (development only)

| Variable | Description |
|---|---|
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Admin account created by `npx prisma db seed`. Password at least 12 characters |
