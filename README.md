# HostMyService

A hosting platform for static sites and Node.js apps. Customers buy a yearly
plan with Razorpay, upload a ZIP or link a public Git repository, and the
platform builds the site and serves it from a VPS with nginx, PM2 and
Let's Encrypt, optionally with a dedicated MongoDB, MySQL or PostgreSQL database.

**Stack:** Next.js 16, React 18, Prisma 5 (PostgreSQL), NextAuth 4, Tailwind CSS, node-ssh.

## Documentation

Everything is in [`docs/`](docs/README.md):

- [Architecture](docs/architecture.md)
- [Security model and coding rules](docs/security.md): read before touching auth, payments or shell commands
- [Security audit, November 2026](docs/security-audit-2026-11.md): **contains manual steps that still need to be done on production**
- [Customer deployment pipeline](docs/deployment-pipeline.md)
- [Payments and subscriptions](docs/payments.md)
- [Operations](docs/operations.md): VPS setup, deploying, cron, runbook
- [Environment variables](docs/environment.md)
- [Database](docs/database.md)
- [Scripts](docs/scripts.md)

## Local development

Requires Node.js 20+ and PostgreSQL.

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, NEXTAUTH_SECRET, RAZORPAY_* at minimum
npx prisma db push
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-long-password' npx prisma db seed
npm run dev
```

Deploying customer sites from a local instance also needs `VPS_HOST`,
`VPS_USER` and `VPS_PRIVATE_KEY`.

Before pushing:

```bash
npx tsc --noEmit && npx eslint . && npm run build
```

Pushing to `main` deploys to production automatically (see
[operations.md](docs/operations.md#continuous-deployment)).

## License

MIT
