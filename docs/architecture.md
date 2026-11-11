# Architecture

## Components

```
                ┌────────────────────────── VPS ───────────────────────────┐
 Browser ──────▶│ nginx ──▶ HostMyService (Next.js, PM2 "hostmyservice")   │
                │   │          │  Prisma ──▶ PostgreSQL                     │
                │   │          │  SSH (node-ssh) ──▶ same VPS               │
                │   │                                                       │
                │   ├──▶ customer static site  /var/www/<domain>            │
                │   └──▶ customer Node app     PM2 "<domain>" on 127.0.0.1:30xx
                │                              runs as Linux user hms_<hash>│
                │        customer MongoDB      PM2 "mongo-<db>" on 127.0.0.1:270xx
                │        webhook server        PM2 "hostmyservice-webhook" :9000
                └───────────────────────────────────────────────────────────┘
 Razorpay ──webhook──▶ /api/webhook/razorpay
 GitHub   ──webhook──▶ webhook server ──▶ fetch + reset, build, restart HostMyService
 cron     ──POST────▶ /api/cron/maintenance (expiry + temp cleanup)
```

HostMyService itself runs on the same VPS that hosts customer sites. It
manages that VPS over SSH as `VPS_USER` (root). This is why the isolation
described in [deployment-pipeline.md](deployment-pipeline.md#isolation) matters:
customer code must never run with the privileges of the control plane.

## Code layout

| Path | Contents |
|---|---|
| `app/(auth)`, `app/(legal)` | Public pages (login, register, legal) |
| `app/dashboard` | Customer dashboard |
| `app/admin` | Admin panel. `app/admin/layout.tsx` redirects anyone who is not an ADMIN |
| `app/actions/admin/*` | Admin Server Actions. Each one checks `getAdminSession()` |
| `app/actions/client/*` | Customer Server Actions. Each one checks the session and ownership |
| `app/actions/payment.ts` | Checkout: create order, verify payment |
| `app/api/webhook/razorpay` | Razorpay webhooks |
| `app/api/cron/maintenance` | Daily maintenance, authenticated with `CRON_SECRET` |
| `app/api/admin/deployments/[id]/download` | Admin download of an uploaded archive |
| `lib/authz.ts` | `getAdminSession`, `getUserSession`, `requireAdmin`, `safeUserSelect` |
| `lib/auto-deploy.ts` | The deployment pipeline |
| `lib/db-provisioner.ts` | Per-site MongoDB / MySQL / PostgreSQL |
| `lib/site-control.ts` | Suspend / resume sites, subscription expiry |
| `lib/subscriptions.ts` | Idempotent payment activation |
| `lib/affiliate.ts` | Affiliate program: commissions, balances, payouts |
| `app/r/[code]` | Public affiliate referral links |
| `lib/ssl.ts` | certbot |
| `lib/nginx-config.ts` | nginx server blocks |
| `lib/zip.ts` | Safe ZIP extraction |
| `lib/shell.ts` | Shell quoting and per-site names |
| `lib/rate-limit.ts` | In-memory rate limiter for login and password reset |
| `lib/validations.ts` | Zod schemas, including the hostname, Git URL and upload limits |
| `middleware.ts` | Login requirement and general request rate limit |
| `scripts/` | Operational scripts (see [scripts.md](scripts.md)) |

## Request authorization

Three layers, and only the last one is a security boundary for data:

1. `middleware.ts` requires a login for most pages and rate-limits requests.
   It deliberately skips Server Action requests (so large uploads work) and
   `/api/auth`, `/api/webhook`, `/api/cron`.
2. `app/admin/layout.tsx` redirects non-admins away from admin pages.
3. Every Server Action and route handler checks authorization itself.

See [security.md](security.md) for the rules.

## Key flows

- **Purchase** → [payments.md](payments.md)
- **Referrals and payouts** → [affiliate-program.md](affiliate-program.md)
- **Deploy** → [deployment-pipeline.md](deployment-pipeline.md)
- **Expiry and suspension** → [deployment-pipeline.md](deployment-pipeline.md#suspension-and-expiry)
