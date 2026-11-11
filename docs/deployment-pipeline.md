# Customer deployment pipeline

How a customer's code becomes a running site. The implementation is
`runFullDeployment()` in `lib/auto-deploy.ts`.

## Lifecycle

1. **Queue.** The customer uploads a ZIP or enters a Git URL
   (`app/actions/client/deploy.ts`). The action checks:
   - the site belongs to the customer and is `ACTIVE`
   - the subscription's status is not `EXPIRED`
   - no deployment for the site is currently `BUILDING` (older `PENDING` ones are replaced by the new one)
   - ZIP: at most 500 MB, extracted with `safeExtractZip()`, and a copy is backed up to Google Drive
   - Git: a public `https://` URL and a valid branch name

   A `Deployment` row is created with status `PENDING`.
2. **Trigger.** An admin clicks Deploy in Admin → Deploy (`triggerDeployment`).
3. **Run.** `runFullDeployment()` executes the steps below and writes each step
   to `DeploymentLog`. The customer sees these logs live, so never log secrets.
4. **Result.** `DEPLOYED` or `FAILED`. On success the customer gets an email.

## Steps

| Step | What happens |
|---|---|
| Validate | Domain re-validated with `domainSchema` (the original rule, so existing domains keep working); Git source re-validated; a missing extracted folder is re-extracted from the saved ZIP (retry case). Suspended sites are refused. |
| Site user | Only if `Site.runAsSiteUser` is true: `useradd --system` for `hms_<hash>` if needed, then checks that `node`, `npm` and `git` work for that user. |
| Database | If the plan provides one and the site has no `dbConnection` yet, provisions it and saves the connection string immediately. Otherwise reuses the saved one. |
| Files | `/var/www/<domain>` created and owned by the site user. ZIP: uploaded over SFTP. Git: `git clone --depth 1` as the site user. A single top-level folder in the archive is flattened. |
| `.env` | The site's saved env vars plus the database URLs, written as `600`, owned by the site user. |
| Detect | A `package.json` (root or one level down) means a Node app; otherwise a static site. |
| Port | Reuses `Site.appPort`; for a site deployed before ports were saved, reuses the port in its current nginx config; otherwise picks the first port from 3020–3999 that is free on the server and not assigned to another site, and saves it. |
| Install | `npm install` as the site user. On `ERESOLVE` (peer dependency conflict), retries with `--legacy-peer-deps`. |
| Build | `npm run build` as the site user, if a build script exists. |
| Start | `pm2 start … --uid <site user>` with `HOME=/var/www/<domain>` and `PORT`. Next.js → `npm start -- -p PORT`; else `server.js`, `app.js`, `index.js`; else static `dist/`, `build/` or `out/` with `serve`; else `npm start`. |
| nginx | Writes `/etc/nginx/sites-available/<domain>`, enables it, `nginx -t`, reload. |
| SSL | certbot. Failure is non-fatal (usually DNS not pointed yet). |
| Finish | Saves `serverPath` and `serverIp`, marks `DEPLOYED`, emails the customer, deletes the local extracted files (the ZIP is kept). |

## Isolation

Customer code (`npm install` scripts, the build, the running app) is untrusted.
For sites with `Site.runAsSiteUser = true` it runs as a per-site Linux user so it cannot read:

- HostMyService's own `.env` (database password, Razorpay secret, SSH key)
- other customers' files or `.env`

| Item | Owner | Mode |
|---|---|---|
| `/var/www/<domain>` and contents | `hms_<hash>:www-data` | `u=rwX,g=rX,o=` (nginx reads static files through the group) |
| `/var/www/<domain>/.env` | `hms_<hash>:hms_<hash>` | `600` |
| `/var/www/hostmyservice` | root | `o=` (see [operations.md](operations.md#protect-hostmyservices-own-files)) |

The username is `hms_` plus the first 12 hex characters of SHA-256 of the domain
(`siteUserName()` in `lib/shell.ts`), so it stays the same across redeploys.

PM2 itself runs as root and starts each app with `--uid/--gid`. Node.js and
npm must be installed system-wide (not with nvm under `/root`), or the site user
can't run them. The deploy stops with a clear error if they're missing.

nginx refuses every path starting with a dot (except `/.well-known/`), so
`.env`, `.git` and `.npm` are never served.

### Which sites are isolated

- Sites created from November 2026 on: `runAsSiteUser = true`.
- Sites created before: `false`. They build and run as root exactly as they
  always did, so existing customers are unaffected. Opt them in one by one
  with `scripts/isolate-site.ts` and a redeploy (see [compatibility.md](compatibility.md)).
- `DEPLOY_RUN_AS_ROOT=true` turns isolation off for every site. It exists only so deploys keep
  working while you fix Node.js on the server. Don't leave it on.

## Databases

| Type | Where | Notes |
|---|---|---|
| MongoDB | dedicated `mongod` per site, PM2 process `mongo-<db>`, port from 27018 | `--auth`, `--bind_ip 127.0.0.1`, runs as `mongodb` user if it exists |
| MySQL | shared server, one database and user per site | user exists for `localhost` and `127.0.0.1` only |
| PostgreSQL | shared server, one database and role per site | `PUBLIC` access to the database revoked |

Names: database `<domain with _>_<hash10>`, user `u_<hash10>`. The password is
24 random alphanumeric characters.

The connection string always uses `127.0.0.1`. Customer apps run on the same
server. To inspect a database, use an SSH tunnel; never open the port.

The connection string is saved in `Site.dbConnection` the first time and reused
on every redeploy. To give a site a fresh database, drop the old one, clear
`dbConnection` in Admin → Websites → edit, and redeploy.

## Suspension and expiry

`lib/site-control.ts`:

- **Suspend** writes `/etc/nginx/hostmyservice-suspended/<domain>.conf`
  containing `return 503;`, reloads nginx and runs `pm2 stop <domain>`. Every
  site's nginx config includes that file through a glob
  (`include …/<domain>.con[f];`), which matches nothing when the site is
  active. Configs created before this feature get the include inserted on first
  suspension.
- **Resume** deletes the file, reloads nginx and restarts the PM2 process.
- `Site.suspendReason` is `EXPIRED` (set by the daily cron) or `ADMIN` (set
  from Admin → Websites). Renewals only resume `EXPIRED` sites.
- The daily cron (`/api/cron/maintenance`) suspends sites whose subscription
  `endDate` has passed (`ACTIVE` or `CANCELLED`), then marks the subscription
  `EXPIRED`. Only subscriptions created on or after `EXPIRY_ENFORCEMENT_START`
  (default 2026-11-12) are considered, so existing customers are never
  suspended automatically. If suspension fails, the subscription is left alone so the next
  run retries.

## Troubleshooting

| Symptom in the logs | Cause and fix |
|---|---|
| `node, npm or git is not available to non-root users` | Node.js is installed under `/root` (nvm). Install it system-wide: [operations.md](operations.md#make-node-available-to-site-users). |
| `Peer dependency conflict detected, retrying…` then success | Normal. The project's dependency ranges are stale. |
| `npm run build failed: … Type error …` | A bug in the customer's code, or the server installed newer dependency versions than the customer has locally. Ask them to commit a `package-lock.json` that matches what they build with. |
| `git clone failed` | Repository is private, URL is wrong, or the branch doesn't exist. Only public HTTPS repositories are supported. |
| `No way to start this app` | The project has neither a `start` script nor `server.js` / `app.js` / `index.js`. |
| `Nginx test failed` | Inspect with `sudo nginx -t` on the server. |
| `SSL provisioning deferred` | DNS doesn't point at the VPS yet. Provision SSL from Admin → Websites later. |
| App returns 502 | `pm2 logs <domain>` on the server. Often the app ignores `PORT`. |
| `Upload archive is no longer on the server` | The ZIP was removed by the 14-day cleanup. Ask the customer to upload again. |
