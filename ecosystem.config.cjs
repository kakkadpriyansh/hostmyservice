// PM2 Ecosystem Config
// Manages both the main Next.js app and the CI/CD webhook server.
//
// Usage:
//   pm2 start ecosystem.config.cjs      # start both
//   pm2 save                            # persist across reboots
//   pm2 startup                         # enable auto-start on boot

module.exports = {
  apps: [
    {
      // ── Main Next.js Application ──────────────────────────────────────────
      name: "hostmyservice",
      script: "node_modules/.bin/next",
      args: "start -p 3006",
      cwd: "/var/www/hostmyservice",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G", // a 500MB upload is held in memory about twice; must stay well above that
      env: {
        NODE_ENV: "production",
        PORT: 3006, // nginx (hostmyservice.in) proxies here; 3000 belongs to a customer site
      },
    },
    {
      // ── CI/CD Webhook Listener ────────────────────────────────────────────
      name: "hostmyservice-webhook",
      script: "scripts/webhook-server.mjs",
      cwd: "/var/www/hostmyservice",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "128M",
      env: {
        NODE_ENV: "production",
        WEBHOOK_PORT: 9000,
        DEPLOY_BRANCH: "main",
        PROJECT_DIR: "/var/www/hostmyservice",
        PM2_APP: "hostmyservice",
        // WEBHOOK_SECRET is read from /var/www/hostmyservice/.env
        // (loaded by the script itself). Requests are rejected without it.
      },
    },
  ],
};
