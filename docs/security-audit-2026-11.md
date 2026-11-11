# Security audit: November 2026

Audit date: 2026-11-12. Scope: the whole repository.

The code changes below are in the repository. **The manual steps in the next
section are not done by deploying the code, and the most urgent ones should be
done first.**

## Manual steps still required

Do these in order. Steps 1–4 deal with exposure that already happened, so
do them before or alongside deploying the fixes.

### 1. Replace the leaked SSH key (urgent)

An SSH private key was committed in `scripts/save-key.js` in commit
`46953ce` and pushed to GitHub. Deleting the file does not remove it from git
history. Assume anyone with access to the repository has it.

```bash
# On your machine
ssh-keygen -t ed25519 -f ~/.ssh/hostmyservice_deploy -N ""
ssh-copy-id -i ~/.ssh/hostmyservice_deploy.pub root@<vps>
node scripts/set-vps-key.mjs ~/.ssh/hostmyservice_deploy        # updates local .env

# On the VPS: put the new key in the production .env (VPS_PRIVATE_KEY),
# then remove the old public key line from /root/.ssh/authorized_keys
nano /root/.ssh/authorized_keys
pm2 restart hostmyservice --update-env
```

Check `/root/.ssh/authorized_keys` for any other keys you don't recognise, and
review `last` and `/var/log/auth.log` for logins you didn't make.

### 1b. Change the VPS and database passwords (urgent)

Early versions of `vps-deploy.mjs` (February 2026) contained the VPS root SSH
password and a password labelled "From DATABASE_URL". They have been scrubbed
from this repository's history, but anyone who cloned or forked it before then
still has them, and GitHub may keep cached copies.

```bash
# On the VPS
passwd root                                  # new root password
# Stop password logins over SSH entirely (keys only)
sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload ssh
# Change the PostgreSQL password, then update DATABASE_URL in .env
sudo -u postgres psql -c "ALTER USER <db-user> WITH PASSWORD '<new-password>';"
pm2 restart hostmyservice --update-env
```

Confirm you can still log in with your SSH key **before** closing your current session.

### 2. Change admin passwords

Default admin passwords were committed in scripts, and real bcrypt hashes
were committed in `prisma/seed.ts`. Reset every admin password:

```bash
npx tsx --env-file=.env scripts/reset-password.ts admin@hostmyservice.in
npx tsx --env-file=.env scripts/reset-password.ts admin@hostmyservice.com
```

### 3. Look for accounts and payments created through the open admin actions

Until this fix, anyone could create an admin account or mark a payment as paid.
Run against the production database:

```sql
-- Admin accounts: every row here should be someone you know
SELECT id, email, name, "createdAt" FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt";

-- Successful payments with no Razorpay payment ID were activated without paying
-- (legitimate ones are admin "Force Activate" actions you remember doing)
SELECT p.id, u.email, p.amount, p."createdAt"
FROM "Payment" p JOIN "User" u ON u.id = p."userId"
WHERE p.status = 'SUCCESS' AND p."razorpayPaymentId" IS NULL;

-- Subscriptions with no payment at all
SELECT s.id, u.email, s."createdAt", s."endDate"
FROM "Subscription" s JOIN "User" u ON u.id = s."userId"
WHERE NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."subscriptionId" = s.id);
```

Demote unknown admins with `npx tsx --env-file=.env scripts/set-role.ts <email> USER`.

### 4. Lock down existing MongoDB databases (urgent)

Every MongoDB database created so far runs without authentication on a public
port. Deploying the code fixes new databases only. Run the migration script,
first as a dry run:

```bash
npx tsx --env-file=.env scripts/secure-existing-databases.ts
npx tsx --env-file=.env scripts/secure-existing-databases.ts --apply
```

By default it only turns on password checking: same port, same host, same
connection string, so customers' apps keep working (they already send the
username and password). It creates any user the old code failed to create, and
rolls an instance back if the saved credentials don't work. Afterwards, check
from your own machine that a connection *without* credentials is refused:
`mongosh "mongodb://<vps-ip>:27018/test" --eval "db.getCollectionNames()"`
should fail with an authentication error.

`--localhost-only` additionally closes the port to the internet, but breaks
customers who connect from outside the server; see [scripts.md](scripts.md).

Because the data was publicly writable, check it for unexpected collections
(ransom notes are common) and tell affected customers.

The script also lists MySQL/PostgreSQL users that are shared by two sites
because of the old 16-character truncation. Re-provision those databases separately.

### 5. Deploy the code and update the server

Follow [operations.md → Upgrading to the November 2026 security release](operations.md#upgrading-to-the-november-2026-security-release).

### 6. Git history

The repository's history was rewritten on 2026-11-12 to remove the SSH key,
the VPS and database passwords, a customer database password, hard-coded
admin passwords and the customer data in old versions of `prisma/seed.ts`.
Everyone with a clone must re-clone (or `git fetch && git reset --hard origin/main`
on a branch with no local work). Don't push an old clone: that would bring the
secrets back.

Rewriting history doesn't make leaked secrets safe. Steps 1, 1b and 2 do.
Forks and GitHub's caches can still hold the old commits; GitHub Support can
purge cached views if needed.

## Findings and fixes

### Critical

| # | Finding | Fix |
|---|---|---|
| 1 | Most admin Server Actions had no authorization check: anyone could create an ADMIN user, activate payments, create subscriptions, edit or suspend sites, run certbot, and read payment and user records including password hashes and reset tokens. Admin pages had no role check. | `lib/authz.ts`; every admin action checks `getAdminSession()`; `app/admin/layout.tsx` redirects non-admins; user queries use `safeUserSelect`. |
| 2 | SSH private key committed in `scripts/save-key.js`. | File removed. **Key rotation is manual (step 1).** |
| 3 | MongoDB instances started without `--auth`, bound to `0.0.0.0`, with the port opened in the firewall. | `lib/db-provisioner.ts`: auth required, localhost only, no firewall change, managed by PM2. **Existing instances: step 4.** |
| 4 | Customer `npm install`, build and app ran as root on the server that holds HostMyService's secrets and every other customer's files. | Per-site Linux user, `pm2 --uid`, `750` directories, `600` `.env` for all new sites. **Existing sites stay as they were until opted in** ([compatibility.md](compatibility.md)). |

### High

| # | Finding | Fix |
|---|---|---|
| 5 | `verifyPayment` could be replayed to create unlimited subscriptions, didn't check order ownership, and duplicated the webhook's subscription. | `activatePayment()` in `lib/subscriptions.ts`: one transactional PENDING→SUCCESS transition shared by checkout, webhook and admin. |
| 6 | Subscription length differed between code paths (admin "Force Activate" gave the plan's `duration` in days). | All paths use `durationYears`, matching the yearly prices. |
| 7 | Redeploying broke customer databases: a new password was returned but MySQL/PostgreSQL kept the old one; MongoDB started a second instance on the same data. | The connection string is saved on first provisioning and reused. MySQL/PostgreSQL reset the password if the user exists. |
| 8 | Database usernames were truncated to 16 characters, so two domains could share a user and each other's data. | Names include a hash of the full domain. PostgreSQL databases revoke `PUBLIC` access. |
| 9 | Debug logging wrote every request header, including session cookies, to the PM2 logs; `/api/debug-session` was public. | Route removed; header logging removed. |
| 10 | 500 MB uploads were buffered in memory, while PM2 restarted the app at 512 MB. | Limit kept at 500 MB for existing customers; `bodySizeLimit` 510 MB and PM2 limit raised to 2 GB. Make sure the VPS has the memory. |
| 11 | `adm-zip` ≤0.6.0 (zip bombs, symlink overwrite, SUID bits) and `nodemailer` advisories. | `adm-zip` 0.6.1 with `safeExtractZip()`; `nodemailer` 10.5; `uuid` 14. `npm audit`: 0 vulnerabilities. |

### Medium

| # | Finding | Fix |
|---|---|---|
| 12 | Expired subscriptions were never enforced; "Suspend" only changed a database field. | `lib/site-control.ts` stops the app and serves 503. Daily cron expires subscriptions created from 2026-11-12 on (older ones are left alone). Renewal resumes sites suspended for expiry. |
| 13 | Git deployments were queued but never run. | `lib/auto-deploy.ts` clones public HTTPS repositories. |
| 14 | Customers couldn't add subdomains. | Shared `hostnameSchema`. |
| 15 | Razorpay webhook verified with the API key secret; signatures compared with `!==`. | `RAZORPAY_WEBHOOK_SECRET` (falls back to the key secret); constant-time comparison. Recurring charges are recorded once each. |
| 16 | The GitHub deploy webhook accepted unsigned requests when `WEBHOOK_SECRET` was unset. | Rejects all requests without a secret. |
| 17 | No rate limit on login or password reset. | `lib/rate-limit.ts`, see [security.md](security.md#rate-limits). Reset tokens are stored hashed. |
| 18 | Database passwords appeared in deployment logs. | Masked. |
| 19 | Uploaded files were never cleaned up. | Extracted files removed after each deploy; cron removes uploads older than 14 days. |
| 20 | App ports were picked by scanning, so a stopped app's port could be reassigned. | `Site.appPort` is saved and reused. |

### Also fixed

- Static sites could serve dotfiles such as `.env` over HTTP. nginx now denies them.
- The admin manual-deploy panel called `/api/admin/deploy-direct`, which didn't exist. It now uses the `deploySite` action, which only accepts folders created by the upload action.
- `updateSiteDetails` stored unvalidated input. It now validates every field.
- Temporary files for `.env` uploads were world-readable. They are now `600` and uniquely named.
- Logs of `Error` objects serialized as `{}`.
- The deployment log viewer re-created its polling timer on every status change.
- ESLint: 100 errors → 0 (41 warnings remain, mostly unused variables).

### Removed files

Machine-specific or one-off scripts containing secrets, hard-coded passwords,
Windows paths, or code that rewrote source files:
`scripts/save-key.js`, `scripts/fix-mongo-user.js`, `reset-admin-password.js`,
`test-login.js`, `update-admin.js`, `check_plans.ts`, `cookies.txt`,
`prisma.config.ts.bak`, `scripts/apply-updates.js`, `scripts/add-auto-flatten.js`,
`scripts/add-firewall-rule.js`, `scripts/check-env.js`, `scripts/check-port-db.js`,
`scripts/diagnose-real-estate.mjs`, `scripts/fix-*.js`, `scripts/generate-seed.ts`,
`scripts/reset-admin-password.ts`, `scripts/set-ed25519-key.js`,
`scripts/set-vps-env.js`, `scripts/test-ssh-app.js`,
`scripts/update-auto-deploy-mongo.js`, `scripts/update-nginx-proxy.js`,
`scripts/upgrade-auto-deploy-pm2.js`. Replacements are listed in [scripts.md](scripts.md).

## Not changed

- **React 18 with Next.js 16** is supported by Next.js 16 (`react ^18.2.0 || ^19`).
- **Stale `prisma/migrations`**: the project uses `prisma db push`. See [database.md](database.md).
- **Single shared VPS**: isolation is by Linux user. Containers per site
  would be stronger; consider them if you host untrusted customers at scale.
- **Renewing a non-auto-renew plan** creates a new subscription instead of
  extending the existing one, so an expired site stays linked to the expired
  subscription. There is no admin screen for extending a subscription yet:
  update its `endDate` in the database, then resume the site from
  Admin → Websites. The `updateSubscription` action already resumes the site
  automatically, so a future edit form only needs to call it.
