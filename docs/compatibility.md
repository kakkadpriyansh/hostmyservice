# Existing customers and the November 2026 release

The November 2026 security release was built so that customers who signed up
before it notice nothing. This page lists every behaviour that could have
affected them and what the code does instead. "Existing" means created before
2026-11-12.

## Nothing changes for existing customers

| Area | New behaviour | Existing customers |
|---|---|---|
| Sites running as root | New sites build and run as their own Linux user | Existing sites keep running exactly as before (as root) until an admin opts them in with `scripts/isolate-site.ts` |
| Subscription expiry | A daily job suspends sites whose subscription has ended | Only subscriptions **created** on or after 2026-11-12 are expired automatically (`EXPIRY_ENFORCEMENT_START`). Older ones are never expired by the job, because some got 30-day end dates on yearly plans |
| Deploy blocked when expired | Only a subscription with status `EXPIRED` blocks deploys | Old subscriptions never get that status automatically, so their deploys aren't blocked even if `endDate` has passed |
| Domain rules | New domains must be valid lowercase hostnames | Existing domains are checked with the original rule and are never lowercased, so their `/var/www/<domain>` path doesn't change |
| App port | Ports are saved per site | On an existing site's first redeploy, its current port is read from its nginx config and kept |
| App start command | | Identical to before, including `npm start -- -p <port>` |
| Environment of the app | Isolated sites get `HOME=/var/www/<domain>` | Legacy sites keep the environment they had |
| Upload size | | Still 500 MB |
| MongoDB databases | New databases listen on 127.0.0.1 | `secure-existing-databases.ts` turns on password checking only. Port, host and connection string stay the same, and customers already use the username and password in that string |
| Password reset links | Tokens are stored hashed | Links emailed before the upgrade keep working until they expire (1 hour) |
| Deployment queue | A running build blocks a new deploy | Old queued deployments that never ran no longer block anything: a new upload replaces them |
| Login | Rate-limited | 10 failed attempts per 15 minutes per account; normal use is unaffected |
| Affiliate program | Approved affiliates earn on referred customers | Users who signed up before can't be attributed to an affiliate; nothing changes until an admin approves someone |

## What existing customers will still see

These are visible but don't break anything:

- **nginx refuses dotfiles** (`/.env`, `/.git` …) on a site's next redeploy.
  `/.well-known/` (SSL and app verification) still works.
- **Deployment logs** mask database passwords.
- **Suspended sites** now really go offline (503). Before, "Suspend" only
  changed a label. Only admins suspend sites.

## Moving existing sites to the new protections

Do this site by site, when convenient:

1. **Run as its own user**: check the app only writes inside
   `/var/www/<domain>`, then
   `npx tsx --env-file=.env scripts/isolate-site.ts <domain>` and redeploy it from
   Admin → Deploy. `--undo <domain>` reverts.
2. **Database on localhost only**: once nobody connects to a customer's
   MongoDB from outside the server, run
   `secure-existing-databases.ts --apply --localhost-only`.
3. **Expiry**: review old subscriptions' end dates in Admin → Subscriptions.
   Correct any that are wrong, then they can be included in automatic expiry by
   moving `EXPIRY_ENFORCEMENT_START` earlier.

Until step 1 is done for a site, that customer's `npm install` and app still run
as root and could read HostMyService's secrets. Prioritise sites whose owners
you know least.
