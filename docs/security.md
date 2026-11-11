# Security model and coding rules

Read this before changing anything that touches authentication, payments,
shell commands or customer data. Most of these rules exist because an earlier
version broke them (see [security-audit-2026-11.md](security-audit-2026-11.md)).

## 1. Every Server Action checks authorization itself

Server Actions are public HTTP endpoints. Anyone can call one whose ID appears
in a client bundle, and `middleware.ts` does not run for them.

```ts
"use server";
import { getAdminSession } from "@/lib/authz";

export async function deleteSomething(id: string) {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  // ...
}
```

- Admin actions: `getAdminSession()` (returns `null` for non-admins) or
  `requireAdmin()` (throws).
- Customer actions: `getUserSession()` **and** an ownership check, e.g.
  `site.userId === session.user.id`.
- An inline `"use server"` function inside a page is also an endpoint. Call an
  action that checks authorization, as the admin pages do.
- Trusted server code (the deployer, cron) calls plain library functions such
  as `runSslProvisioning`. Library functions in `lib/` have no auth check and
  must not be exported from a `"use server"` file.

`app/admin/layout.tsx` redirecting non-admins is a convenience, not protection.

## 2. Never return secrets from queries

Use `safeUserSelect` from `lib/authz.ts` whenever a query that includes a
`User` leaves the server. `include: { user: true }` returns the password hash
and reset token.

## 3. Validate anything that reaches a shell, nginx or a database name

Customer input ends up in shell commands run as root over SSH.

| Value | Validate with |
|---|---|
| New domain (user input) | `hostnameSchema` (`lib/validations.ts`) |
| Domain already in the database | `domainSchema` (the original, shell-safe rule; doesn't lowercase) |
| Git URL / branch | `gitRepoUrlSchema`, `gitBranchSchema` |
| IDs | `siteIdSchema`, `z.string().cuid()` |
| Arbitrary strings in a command | `shQuote()` from `lib/shell.ts` |

Validate in the action that stores the value and again where it is used
(`lib/auto-deploy.ts` re-parses the domain and Git source).

## 4. Customer code doesn't run as root

For every site with `runAsSiteUser = true` (all sites created from November 2026),
`npm install`, `npm run build` and the app itself run as the site's own Linux
user (`hms_<hash>`). Older sites still run as root until opted in; see
[compatibility.md](compatibility.md). Files are `owner=site user, group=www-data, others=none`,
and `.env` is `600`. Don't add a deploy step that runs customer-controlled code
without going through `runAs()` in `lib/auto-deploy.ts`.

`DEPLOY_RUN_AS_ROOT=true` turns this off. Use it only as a short-term escape
hatch while fixing the VPS (see [operations.md](operations.md#make-node-available-to-site-users)).

## 5. Customer databases listen on localhost only and require a password

New databases are created by `lib/db-provisioner.ts`, never by hand. Never open
a database port in the firewall. Admins who need access use an SSH tunnel:

```bash
ssh -L 27018:127.0.0.1:27018 root@<vps>
```

## 6. Payments are idempotent

Activation goes through `activatePayment()` in `lib/subscriptions.ts`, which
only succeeds once per payment. Don't create subscriptions anywhere else. See
[payments.md](payments.md).

## 7. Compare secrets in constant time

Use `safeEqual()` from `lib/crypto.ts` for signatures and shared secrets, never `===`.

## 8. Logs must not contain secrets

- Don't log request headers (they contain session cookies).
- Mask connection strings with `maskConnectionString()`.
- Deployment logs are shown to customers. Write them assuming the customer reads them.

## 9. Uploads

- Extract ZIPs only with `safeExtractZip()` (`lib/zip.ts`). It rejects path
  traversal, symlinks and zip bombs.
- The upload limit is `MAX_UPLOAD_BYTES` (500 MB). It must stay below
  `bodySizeLimit` in `next.config.mjs`, which must stay well below PM2's
  `max_memory_restart` in `ecosystem.config.cjs`, because Server Actions
  buffer the whole request in memory.

## 10. Secrets never go in the repo

No keys, passwords, tokens or real customer data in code, seeds or scripts.
Scripts take secrets from `.env` or arguments. If a secret is committed,
treat it as leaked: rotate it first, then clean up.

## Rate limits

| What | Limit | Where |
|---|---|---|
| All matched requests | 300 / min per user (or IP when logged out) | `middleware.ts` |
| Login | 10 / 15 min per email, 30 / 15 min per IP | `lib/auth.ts` |
| Password reset emails | 3 / h per email, 10 / h per IP | `app/actions/auth.ts` |

These counters are in memory and reset when the app restarts. They assume a
single instance; use Redis if HostMyService ever runs on more than one.

The limits rely on nginx passing the client IP. See
[operations.md](operations.md#nginx-for-hostmyservice-itself).

## Password reset tokens

Only the SHA-256 hash of a reset token is stored. The plain token exists only
in the email link and expires after one hour. Links sent before the upgrade
stored the plain UUID; those still match, but only UUID-shaped input is
compared directly, so a leaked hash can't be used as a token.
