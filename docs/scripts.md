# Scripts

Run scripts from the repository root. TypeScript scripts use `tsx`; pass the
production `.env` with `--env-file` when they need the database or the VPS.
None of them contain secrets: they read `.env` or take arguments.

| Script | Purpose |
|---|---|
| `scripts/secure-existing-databases.ts` | One-time: turn on authentication for MongoDB instances created before November 2026 |
| `scripts/isolate-site.ts` | Opt an existing site into running as its own Linux user (from its next deploy) |
| `scripts/reset-password.ts` | Reset any user's password |
| `scripts/set-role.ts` | Make a user an admin, or remove admin rights |
| `scripts/set-vps-key.mjs` | Write an SSH private key into `.env` as `VPS_PRIVATE_KEY` |
| `scripts/get-refresh-token.js` | Get a Google Drive OAuth refresh token (reads `oauth-credentials.json` from the repository root) |
| `scripts/list-plans.js` | Print plans in the database |
| `scripts/check-recent-site.js` | Print the most recently created sites |
| `scripts/check-vps.ts` | Check the VPS connection and PM2 list; with a domain argument, also that site's files and HTTPS response |
| `scripts/webhook-server.mjs` | CI/CD webhook server (run by PM2, see [operations.md](operations.md#continuous-deployment)) |
| `vps-deploy.mjs` | Manually deploy HostMyService to the VPS over SSH |

## `secure-existing-databases.ts`

```bash
npx tsx --env-file=.env scripts/secure-existing-databases.ts                   # dry run
npx tsx --env-file=.env scripts/secure-existing-databases.ts --apply           # enable auth
npx tsx --env-file=.env scripts/secure-existing-databases.ts --apply --localhost-only
```

Default (`--apply`), with no effect on customers: for every site whose
`dbConnection` is a MongoDB URL, it makes sure the database user exists with
the password in the saved connection string (the old provisioner sometimes
failed to create it), restarts `mongod` with `--auth` under PM2 on the same
port and network binding, and checks that the saved credentials work. If they
don't, it restores the previous instance and reports the site.

`--localhost-only` also binds to 127.0.0.1, removes the firewall rule,
rewrites `dbConnection` and the site's `.env` to `127.0.0.1` and restarts the
app. Customers who connect to their database from outside the server (for
example with Compass) lose that access, so only use it once that's agreed.

It also warns about database users shared by more than one site. Safe to re-run.

## `isolate-site.ts`

```bash
npx tsx --env-file=.env scripts/isolate-site.ts --list               # sites still running as root
npx tsx --env-file=.env scripts/isolate-site.ts example.com          # opt in (takes effect on next deploy)
npx tsx --env-file=.env scripts/isolate-site.ts --undo example.com
```

Check that the app only writes inside `/var/www/<domain>` first. See
[compatibility.md](compatibility.md).

## `reset-password.ts`

```bash
npx tsx --env-file=.env scripts/reset-password.ts admin@hostmyservice.in             # random password, printed once
npx tsx --env-file=.env scripts/reset-password.ts admin@hostmyservice.in 'my-new-password'
```

Passwords must be at least 12 characters. Any pending reset link stops working.

## `set-role.ts`

```bash
npx tsx --env-file=.env scripts/set-role.ts someone@example.com ADMIN
npx tsx --env-file=.env scripts/set-role.ts someone@example.com USER
```

The user must log out and back in.

## `set-vps-key.mjs`

```bash
node scripts/set-vps-key.mjs ~/.ssh/hostmyservice_deploy          # writes ./.env
node scripts/set-vps-key.mjs ~/.ssh/hostmyservice_deploy prod.env
```

Rejects keys with a passphrase. Writes the `.env` file with mode `600`.

## Adding a script

- Read secrets from the environment or arguments. Never hard-code keys,
  passwords, emails of real users, domains or machine-specific paths.
- Default to a dry run for anything that changes production.
- Add it to the table above.
