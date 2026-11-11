# HostMyService documentation

HostMyService is a hosting platform. Customers buy a yearly plan, upload a ZIP
or link a Git repository, and the platform builds the site and serves it from
a VPS with nginx, PM2 and Let's Encrypt.

These docs are for the people who develop and run HostMyService.

| Document | Read it when you need to… |
|---|---|
| [architecture.md](architecture.md) | understand how the pieces fit together |
| [security.md](security.md) | write code that touches auth, payments, the shell or customer data |
| [security-audit-2026-11.md](security-audit-2026-11.md) | see what the November 2026 audit found, what was fixed, and the **manual steps still required** |
| [compatibility.md](compatibility.md) | know how the November 2026 release treats customers who signed up before it |
| [deployment-pipeline.md](deployment-pipeline.md) | understand or debug how customer sites are built and served |
| [payments.md](payments.md) | change checkout, Razorpay webhooks or subscription logic |
| [affiliate-program.md](affiliate-program.md) | run or change the developer affiliate (referral) program |
| [operations.md](operations.md) | set up the VPS, deploy HostMyService, run cron, handle incidents |
| [environment.md](environment.md) | look up an environment variable |
| [database.md](database.md) | change the Prisma schema |
| [scripts.md](scripts.md) | run a maintenance script |

## Quick start (local development)

```bash
npm install
cp .env.example .env          # fill in at least DATABASE_URL, NEXTAUTH_SECRET, RAZORPAY_*
npx prisma db push
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-long-password' npx prisma db seed
npm run dev
```

Before opening a pull request:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```
