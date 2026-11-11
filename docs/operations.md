# Operations

Running HostMyService on the VPS. HostMyService and all customer sites share
one Ubuntu server; HostMyService lives in `/var/www/hostmyservice` and runs
under PM2 as root.

## Server prerequisites

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git unzip postgresql

# Node.js system-wide (NOT nvm under /root: site users must be able to run it)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 serve

# Only if you sell database plans
#   MongoDB: install mongodb-org (provides mongod, mongosh and the mongodb user)
#   MySQL:   sudo apt install -y mysql-server
#   (PostgreSQL is already installed above)

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Never open database ports (27017+, 3306, 5432) in the firewall.

## Make node available to site users

Customer code runs as per-site users (see
[deployment-pipeline.md](deployment-pipeline.md#isolation)), so `node`, `npm`
and `git` must be on the default `PATH` for any user. Check:

```bash
sudo -u nobody -H bash -c 'command -v node npm git'
```

All three paths should print (for example `/usr/bin/node`). If `node` lives
under `/root/.nvm`, install Node.js with NodeSource as above, then re-install
global tools with the new npm (`sudo npm install -g pm2 serve`) and run
`pm2 update`.

## Protect HostMyService's own files

Site users must not be able to read HostMyService's code or `.env`:

```bash
sudo chown -R root:root /var/www/hostmyservice
sudo chmod 700 /var/www/hostmyservice
sudo chmod 600 /var/www/hostmyservice/.env
```

## Environment

Copy `.env.example` to `/var/www/hostmyservice/.env` and fill it in. See
[environment.md](environment.md). After changing `.env`:

```bash
cd /var/www/hostmyservice && npm run build && pm2 restart hostmyservice --update-env
```

(`NEXT_PUBLIC_*` values are baked in at build time; server-only values just need a restart.)

## Starting HostMyService

```bash
cd /var/www/hostmyservice
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 start ecosystem.config.cjs     # starts hostmyservice and hostmyservice-webhook
pm2 save
pm2 startup                        # run the command it prints, once
```

## nginx for HostMyService itself

The app relies on the client IP for rate limiting and must accept 500 MB uploads:

```nginx
server {
    server_name hostmyservice.in www.hostmyservice.in;

    client_max_body_size 510m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;   # deployments run inside a request
    }
}
```

Then `sudo certbot --nginx -d hostmyservice.in -d www.hostmyservice.in`.

## Daily maintenance cron

`/api/cron/maintenance` expires overdue subscriptions created on or after
`EXPIRY_ENFORCEMENT_START` (suspending their sites) and deletes uploads older
than 14 days. Subscriptions from before the November 2026 release are never
expired automatically (see [compatibility.md](compatibility.md)). Set `CRON_SECRET` in `.env`, then:

```bash
sudo crontab -e
```

```cron
# HostMyService maintenance, 03:15 server time
15 3 * * * S=$(grep -E '^CRON_SECRET=' /var/www/hostmyservice/.env | cut -d= -f2- | tr -d '"'); curl -fsS -X POST -H "Authorization: Bearer $S" http://127.0.0.1:3000/api/cron/maintenance >> /var/log/hostmyservice-cron.log 2>&1
```

The response lists each subscription it expired and whether its site was
suspended. Run the same `curl` by hand to test it.

## Continuous deployment

`scripts/webhook-server.mjs` (PM2 `hostmyservice-webhook`, port 9000) listens
for GitHub pushes to `main` and runs:
`git pull → npm install → prisma generate → prisma db push → npm run build → pm2 restart hostmyservice`.

Setup:

1. Set `WEBHOOK_SECRET` in `.env` (the server rejects every request if it's empty).
2. GitHub → repository → Settings → Webhooks → add
   `http://<vps-ip>:9000/` (or proxy it through nginx with HTTPS),
   content type `application/json`, the same secret, push events only.
3. `pm2 restart hostmyservice-webhook --update-env`.

`prisma db push` refuses changes that would lose data. If a deploy fails
there, make the change by hand (see [database.md](database.md)).

`vps-deploy.mjs` is the manual alternative: run it from your machine to do the same over SSH.

## Upgrading to the November 2026 security release

Do the urgent manual steps in
[security-audit-2026-11.md](security-audit-2026-11.md#manual-steps-still-required)
(new SSH key, admin passwords, account review) as well. Then:

1. **Code and schema**
   ```bash
   cd /var/www/hostmyservice
   git pull origin main
   npm install
   npx prisma generate
   npx prisma db push        # adds Site.appPort, Site.suspendReason, Site.runAsSiteUser
   ```
2. **Environment**: add `RAZORPAY_WEBHOOK_SECRET`, `CRON_SECRET` and
   `WEBHOOK_SECRET` (see [environment.md](environment.md)). Set the same
   webhook secret in the Razorpay dashboard.
3. **Build and restart**
   ```bash
   npm run build
   # Re-create the processes so the new 2G memory limit applies
   pm2 delete hostmyservice hostmyservice-webhook
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
4. **Node for site users**: check [above](#make-node-available-to-site-users).
5. **Protect HostMyService's files**: [above](#protect-hostmyservices-own-files).
6. **Secure existing MongoDB instances**: `scripts/secure-existing-databases.ts`,
   dry run first ([scripts.md](scripts.md)). The default only turns on
   password checking, which customers' connection strings already include.
7. **nginx** for HostMyService: add the `X-Forwarded-For` / `X-Real-IP`
   headers and `client_max_body_size` ([above](#nginx-for-hostmyservice-itself)).
8. **Cron**: add the [maintenance job](#daily-maintenance-cron).
9. **Existing sites keep running as root** so customers notice nothing. Move
   them to their own users one by one with `scripts/isolate-site.ts` and a
   redeploy, as described in [compatibility.md](compatibility.md).

## Runbook

| Symptom | Check | Fix |
|---|---|---|
| `The column X does not exist in the current database` (Prisma `P2022`) | Schema changed without a `db push` | `npx prisma db push && pm2 restart hostmyservice` |
| Browser shows "Too Many Requests" | `middleware.ts` limit (300/min per user) | Restarting the app clears counters. If everyone hits it, nginx isn't sending `X-Forwarded-For` |
| "Too many login attempts" | Login limiter | Wait 15 minutes, or restart the app |
| App restarts during uploads | `pm2 logs hostmyservice`, memory | Keep `max_memory_restart` above upload size + normal usage |
| Customer deploy fails | Deployment logs in Admin → Websites → site | [deployment-pipeline.md → Troubleshooting](deployment-pipeline.md#troubleshooting) |
| Customer site shows 503 | `ls /etc/nginx/hostmyservice-suspended/` | Site is suspended; resume from Admin → Websites if that's wrong |
| Customer site shows 502 | `pm2 logs <domain>` | App crashed or ignores `PORT` |
| Payment succeeded but no subscription | Razorpay dashboard → webhook deliveries | Fix the webhook secret, then Force Activate in Admin → Payments |
| Expired sites not suspended | `/var/log/hostmyservice-cron.log` | Check the cron line and `CRON_SECRET` |
| `nginx -t` fails after a deploy | `sudo nginx -t` | Fix or remove `/etc/nginx/sites-enabled/<domain>` |

Useful commands:

```bash
pm2 ls                                   # all processes (HostMyService, sites, mongo-*)
pm2 logs hostmyservice --lines 200
pm2 logs <domain>
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certificates
ss -tlnp                                 # listening ports
```
