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
      args: "start",
      cwd: "/var/www/hostmyservice",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
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
        // WEBHOOK_SECRET is read from the system environment or .env
        // Set it on the server:  export WEBHOOK_SECRET="your-secret-here"
      },
    },
  ],
};
