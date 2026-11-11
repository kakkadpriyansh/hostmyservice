/**
 * CI/CD Webhook Server
 *
 * Listens for GitHub push events on the configured port.
 * On receiving a valid push to the target branch, it runs:
 *   git fetch + reset → npm install → prisma generate → prisma db push → npm run build → pm2 restart hostmyservice
 *
 * Run via PM2:
 *   pm2 start scripts/webhook-server.mjs --name hostmyservice-webhook
 */

import http from "http";
import crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { appendFileSync, existsSync, readFileSync } from "fs";

const execAsync = promisify(exec);

// Load the project's .env (PM2 doesn't), without overriding variables that
// are already set in the environment.
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
loadDotEnv(`${process.env.PROJECT_DIR || "/var/www/hostmyservice"}/.env`);

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || "";
const BRANCH = process.env.DEPLOY_BRANCH || "main";
const PROJECT_DIR = process.env.PROJECT_DIR || "/var/www/hostmyservice";
const PM2_APP_NAME = process.env.PM2_APP || "hostmyservice";
const LOG_FILE = `${PROJECT_DIR}/deploy.log`;
// ───────────────────────────────────────────────────────────────────────────

function logSync(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch { /* non-fatal */ }
}

/**
 * Verify HMAC-SHA256 signature from GitHub's X-Hub-Signature-256 header.
 */
function verifySignature(body, signature) {
  // Fail closed: without a secret anyone could trigger a redeploy
  if (!SECRET) {
    logSync("REJECTED: WEBHOOK_SECRET is not set. Set it to the secret configured in GitHub.");
    return false;
  }
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(body);
  const digest = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

let isDeploying = false;

/**
 * Run the full deploy sequence.
 */
async function runDeploy() {
  if (isDeploying) {
    logSync("Deploy already in progress — skipping this trigger.");
    return;
  }
  isDeploying = true;
  logSync("Starting deployment...");

  const steps = [
    // fetch + hard reset (not pull) so rewritten history on GitHub can't break deploys
    { label: "git fetch",          cmd: `git fetch origin ${BRANCH}` },
    { label: "git reset",          cmd: `git reset --hard origin/${BRANCH}` },
    { label: "npm install",        cmd: "npm install --prefer-offline" },
    { label: "prisma generate",    cmd: "npx prisma generate" },
    { label: "prisma db push",     cmd: "npx prisma db push --skip-generate" },
    { label: "npm run build",      cmd: "npm run build" },
    { label: `pm2 restart ${PM2_APP_NAME}`, cmd: `pm2 restart ${PM2_APP_NAME}` },
  ];

  try {
    for (const step of steps) {
      logSync(`Running: ${step.label} ...`);
      const { stdout, stderr } = await execAsync(step.cmd, {
        cwd: PROJECT_DIR,
        timeout: 10 * 60 * 1000, // 10-minute timeout per step
        env: { ...process.env, CI: "true" },
      });
      if (stdout) logSync(`stdout: ${stdout.trim()}`);
      if (stderr) logSync(`stderr: ${stderr.trim()}`);
      logSync(`Done: ${step.label}`);
    }
    logSync("Deployment completed successfully!");
  } catch (err) {
    logSync(`Deployment FAILED: ${err.message}`);
  } finally {
    isDeploying = false;
  }
}

// ─── HTTP Server ───────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", deploying: isDeploying }));
    return;
  }

  // Only accept POST /webhook
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk.toString(); });
  req.on("end", () => {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];

    if (!verifySignature(body, signature)) {
      logSync("Invalid signature — request rejected.");
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    if (event !== "push") {
      res.writeHead(200);
      res.end(`Ignored event: ${event}`);
      return;
    }

    let payload;
    try { payload = JSON.parse(body); }
    catch { res.writeHead(400); res.end("Bad JSON"); return; }

    const pushedBranch = (payload.ref || "").replace("refs/heads/", "");
    if (pushedBranch !== BRANCH) {
      logSync(`Push to '${pushedBranch}' — not deploying (target: '${BRANCH}').`);
      res.writeHead(200);
      res.end(`Ignored branch: ${pushedBranch}`);
      return;
    }

    logSync(`Push to '${BRANCH}' received — triggering deploy...`);
    res.writeHead(200);
    res.end("Deploy triggered");

    runDeploy().catch((err) => logSync(`Unhandled error: ${err.message}`));
  });
});

server.listen(PORT, () => {
  logSync(`Webhook server listening on port ${PORT}`);
  logSync(`  Project dir : ${PROJECT_DIR}`);
  logSync(`  Branch      : ${BRANCH}`);
  logSync(`  PM2 app     : ${PM2_APP_NAME}`);
  logSync(`  Secret set  : ${SECRET ? "yes" : "NO — all requests will be rejected"}`);
});
