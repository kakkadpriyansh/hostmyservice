import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { SSHClient } from "@/lib/ssh-client";
import { generateNginxConfig, generateNodeNginxConfig } from "@/lib/nginx-config";
import { DbProvisioner } from "@/lib/db-provisioner";
import { sendSiteLiveEmail } from "@/lib/email";
import { runSslProvisioning } from "@/lib/ssl";
import { env } from "@/lib/env";
import { domainSchema, gitRepoUrlSchema, gitBranchSchema } from "@/lib/validations";
import { safeExtractZip } from "@/lib/zip";
import { shQuote, siteUserName, maskConnectionString } from "@/lib/shell";

const FIRST_APP_PORT = 3020;
const LAST_APP_PORT = 3999;

export async function runFullDeployment(
  deploymentId: string
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  const logs: string[] = [];
  const ssh = new SSHClient();
  let localExtractDir: string | null = null;

  // Helper: log to console, array, and DB
  const logStep = async (
    step: string,
    output: string,
    status: "SUCCESS" | "FAILED" | "PENDING"
  ) => {
    // Strip ANSI color codes from build tool output so logs render cleanly
    output = output.replace(/\x1b\[[0-9;]*m/g, "");
    const line = `${new Date().toISOString()}: [${step}] ${output}`;
    console.log(`[AutoDeploy ${deploymentId}] ${line}`);
    logs.push(line);
    try {
      await prisma.deploymentLog.create({
        data: { deploymentId, step, output, status },
      });
    } catch (_) {
      // Non-fatal — log DB errors are not worth stopping the deploy
    }
  };

  try {
    // ── 1. Fetch deployment with all relations ──────────────────────────────
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        site: {
          include: {
            subscription: {
              include: {
                plan: true,
                user: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!deployment || !deployment.site) {
      return { success: false, logs, error: "Deployment or site not found" };
    }

    const site = deployment.site;
    const domainResult = domainSchema.safeParse(site.domain);
    if (!domainResult.success) {
      return {
        success: false,
        logs,
        error: `Invalid domain format: ${domainResult.error.issues[0]?.message}`,
      };
    }
    const domain = domainResult.data;

    if (site.status !== "ACTIVE") {
      return { success: false, logs, error: "Site is suspended. Resume it before deploying." };
    }

    // ── 1b. Resolve the source: Git repository or uploaded ZIP ─────────────
    let gitSource: { url: string; branch: string } | null = null;
    if (deployment.type === "GIT") {
      const url = gitRepoUrlSchema.safeParse(deployment.gitRepoUrl);
      const branch = gitBranchSchema.safeParse(deployment.gitBranch || "main");
      if (!url.success || !branch.success) {
        return { success: false, logs, error: "Invalid Git repository URL or branch" };
      }
      gitSource = { url: url.data, branch: branch.data };
    } else {
      if (!deployment.uploadPath) {
        return { success: false, logs, error: "No upload archive found for this deployment" };
      }
      // The extracted folder is removed after each run; re-extract on retry
      if (!existsSync(deployment.uploadPath)) {
        if (!deployment.archivePath || !existsSync(deployment.archivePath)) {
          return { success: false, logs, error: "Upload archive is no longer on the server. Please upload again." };
        }
        await safeExtractZip(deployment.archivePath, deployment.uploadPath);
      }
      localExtractDir = deployment.uploadPath;
    }

    const plan = site.subscription?.plan;
    const clientUser = site.subscription?.user || site.user;
    const remoteDir = `/var/www/${domain}`;

    // Customer code runs as a dedicated unprivileged user per site, so it can
    // read neither HostMyService's own secrets nor other customers' files.
    // Sites created before this existed keep the old behaviour (run as the SSH
    // user) until an admin opts them in: see scripts/isolate-site.ts.
    const runAsRoot = env.DEPLOY_RUN_AS_ROOT === "true" || !site.runAsSiteUser;
    const siteUser = siteUserName(domain);
    const runAs = (cmd: string) =>
      runAsRoot ? cmd : `sudo -u ${siteUser} -H bash -c ${shQuote(cmd)}`;

    // ── 2. Mark as BUILDING ─────────────────────────────────────────────────
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "BUILDING" },
    });
    await logStep("Init", `Starting full deployment for ${domain}`, "SUCCESS");

    // ── 3. Connect SSH ──────────────────────────────────────────────────────
    await logStep("SSH", "Connecting to VPS...", "PENDING");
    await ssh.connect();
    await logStep("SSH", "Connected to VPS", "SUCCESS");

    // ── 3b. Per-site Linux user ─────────────────────────────────────────────
    if (!runAsRoot) {
      await logStep("Isolation", `Preparing site user ${siteUser}...`, "PENDING");
      await ssh.execCommand(
        `id -u ${siteUser} >/dev/null 2>&1 || sudo useradd --system --home-dir ${remoteDir} --no-create-home --shell /usr/sbin/nologin ${siteUser}`
      );
      const toolCheck = await ssh.execCommand(
        `sudo -u ${siteUser} -H bash -c 'command -v node && command -v npm && command -v git'`
      );
      if (toolCheck.code !== 0) {
        throw new Error(
          "node, npm or git is not available to non-root users on the VPS. Install Node.js system-wide (see docs/deployment-pipeline.md), or set DEPLOY_RUN_AS_ROOT=true temporarily."
        );
      }
      await logStep("Isolation", `Site runs as ${siteUser}`, "SUCCESS");
    }

    // ── 4. Database: reuse existing credentials, provision only once ──────
    let dbConnectionString: string | null = site.dbConnection || null;
    if (plan?.providesDb && plan?.dbType && plan.dbType !== "NONE") {
      if (dbConnectionString) {
        await logStep("DB", `Reusing existing ${plan.dbType} database`, "SUCCESS");
      } else {
        await logStep("DB", `Provisioning dedicated ${plan.dbType} database...`, "PENDING");
        const dbProvisioner = new DbProvisioner(ssh);
        const { dbName, username, password } = DbProvisioner.generateCredentials(domain);

        switch (plan.dbType) {
          case "MONGODB":
            dbConnectionString = await dbProvisioner.provisionMongoDBPortWise(dbName, username, password);
            break;
          case "MYSQL":
            dbConnectionString = await dbProvisioner.provisionMySQL(dbName, username, password);
            break;
          case "POSTGRESQL":
            dbConnectionString = await dbProvisioner.provisionPostgreSQL(dbName, username, password);
            break;
        }

        // Save immediately so a later failure doesn't cause a second provisioning
        if (dbConnectionString) {
          await prisma.site.update({
            where: { id: site.id },
            data: { dbConnection: dbConnectionString },
          });
          await logStep("DB", `${plan.dbType} database provisioned: ${maskConnectionString(dbConnectionString)}`, "SUCCESS");
        }
      }
    }

    // ── 5. Create remote directory owned by the site user ──────────────────
    await logStep("Files", `Creating remote directory: ${remoteDir}`, "PENDING");
    await ssh.execCommand(`sudo mkdir -p ${remoteDir}`);
    const fixOwnership = async () => {
      if (runAsRoot) return;
      // Owner: site user. Group: www-data so nginx can read static files. Others: nothing.
      await ssh.execCommand(`sudo chown -R ${siteUser}:www-data ${remoteDir}`);
      await ssh.execCommand(`sudo chmod -R u=rwX,g=rX,o= ${remoteDir}`);
    };
    await fixOwnership();
    await logStep("Files", "Remote directory created", "SUCCESS");

    // ── 6. Fetch source ─────────────────────────────────────────────────────
    if (gitSource) {
      await logStep("Git", `Cloning ${gitSource.url} (branch ${gitSource.branch})...`, "PENDING");
      const cloneDir = `${remoteDir}/.hms-src`;
      const clone = await ssh.execCommand(
        runAs(
          `rm -rf ${cloneDir} && GIT_TERMINAL_PROMPT=0 git clone --depth 1 --branch ${shQuote(gitSource.branch)} -- ${shQuote(gitSource.url)} ${cloneDir}`
        )
      );
      if (clone.code !== 0) {
        throw new Error(
          `git clone failed (is the repository public and the branch correct?): ${(clone.stderr || clone.stdout).trim()}`
        );
      }
      await ssh.execCommand(
        runAs(`rm -rf ${cloneDir}/.git && cp -a ${cloneDir}/. ${remoteDir}/ && rm -rf ${cloneDir}`)
      );
      await logStep("Git", "Repository cloned", "SUCCESS");
    } else {
      await logStep("Upload", `Uploading files to ${remoteDir}...`, "PENDING");
      await ssh.uploadDirectory(localExtractDir!, remoteDir);
    }

    // Auto-flatten nested folders into main directory
    // If the customer zipped an outer folder (e.g. "real-estate-crm/"), move contents to main ${remoteDir}
    await ssh.execCommand(`
      rm -rf "${remoteDir}/__MACOSX" "${remoteDir}/.DS_Store" "${remoteDir}/Thumbs.db" 2>/dev/null || true
      if [ ! -f "${remoteDir}/package.json" ] && [ ! -f "${remoteDir}/index.html" ]; then
        FOUND_MAIN=$(find "${remoteDir}" -mindepth 1 -maxdepth 2 -not -path "*/node_modules/*" \\( -name "package.json" -o -name "index.html" \\) 2>/dev/null | head -n 1)
        if [ -n "$FOUND_MAIN" ]; then
          SUB_DIR=$(dirname "$FOUND_MAIN")
          if [ "$SUB_DIR" != "${remoteDir}" ]; then
            cp -r "$SUB_DIR"/* "${remoteDir}/" 2>/dev/null || true
            cp -r "$SUB_DIR"/.[!.]* "${remoteDir}/" 2>/dev/null || true
            rm -rf "$SUB_DIR"
          fi
        fi
      fi
    `);
    await fixOwnership();

    await logStep("Upload", "Files uploaded and normalized to main directory", "SUCCESS");

    // ── 7. Build and Auto-Inject Environment Variables into .env ────────────
    let finalEnvContent = site.envVars ? site.envVars.trim() : "";

    if (dbConnectionString) {
      if (plan?.dbType === "MONGODB") {
        finalEnvContent += `\n# Auto-generated MongoDB Connection by HostMyService\nMONGO_URI="${dbConnectionString}"\nMONGODB_URI="${dbConnectionString}"\nDATABASE_URL="${dbConnectionString}"\n`;
      } else if (plan?.dbType === "MYSQL") {
        finalEnvContent += `\n# Auto-generated MySQL Connection by HostMyService\nMYSQL_URL="${dbConnectionString}"\nDATABASE_URL="${dbConnectionString}"\n`;
      } else if (plan?.dbType === "POSTGRESQL") {
        finalEnvContent += `\n# Auto-generated PostgreSQL Connection by HostMyService\nPOSTGRES_URL="${dbConnectionString}"\nDATABASE_URL="${dbConnectionString}"\n`;
      }
    }

    if (finalEnvContent.trim()) {
      await logStep("Env", "Injecting and writing .env file...", "PENDING");
      await ssh.uploadString(finalEnvContent.trim() + "\n", `${remoteDir}/.env`);
      // Only the site user may read its secrets
      if (!runAsRoot) {
        await ssh.execCommand(`sudo chown ${siteUser}:${siteUser} ${remoteDir}/.env`);
      }
      await ssh.execCommand(`sudo chmod 600 ${remoteDir}/.env`);
      await logStep("Env", ".env file with auto-injected database connection written", "SUCCESS");
    }

    // ── 8. Detect app type (checking root and 1 level deep) ────────────────
    await logStep("Detect", "Detecting application structure...", "PENDING");

    // Check root and immediate subfolders for package.json
    const findPkg = await ssh.execCommand(
      `find ${remoteDir} -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" | head -n 1`
    );
    const pkgPath = findPkg.stdout.trim();
    const isNodeApp = !!pkgPath;
    const projectDir = isNodeApp ? path.posix.dirname(pkgPath) : remoteDir;

    await logStep("Detect", `App type: ${isNodeApp ? "Node.js (PM2 Managed)" : "Static HTML"}`, "SUCCESS");

    let appPort: number | null = null;

    if (isNodeApp) {
      // ── 8a. Port: keep the site's port across redeploys ────────────────────
      // Sites deployed before ports were saved: keep the port from their nginx config
      if (!site.appPort) {
        const existing = await ssh.execCommand(
          `grep -oE 'proxy_pass http://127\.0\.0\.1:[0-9]+' /etc/nginx/sites-available/${domain} 2>/dev/null | head -n 1 | grep -oE '[0-9]+$'`
        );
        const previousPort = parseInt(existing.stdout.trim(), 10);
        if (previousPort >= 1024 && previousPort <= 65535) {
          const owner = await prisma.site.findUnique({ where: { appPort: previousPort }, select: { id: true } });
          if (!owner) {
            await prisma.site.update({ where: { id: site.id }, data: { appPort: previousPort } });
            site.appPort = previousPort;
          }
        }
      }

      if (site.appPort) {
        appPort = site.appPort;
        await logStep("Node", `Reusing port ${appPort}`, "SUCCESS");
      } else {
        await logStep("Node", "Finding available port for PM2...", "PENDING");
        const taken = new Set(
          (await prisma.site.findMany({ where: { appPort: { not: null } }, select: { appPort: true } }))
            .map((s) => s.appPort)
        );
        for (let port = FIRST_APP_PORT; port <= LAST_APP_PORT; port++) {
          if (taken.has(port)) continue;
          const portCheck = await ssh.execCommand(
            `ss -tlnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${port}$" && echo "in_use" || echo "free"`
          );
          if (portCheck.stdout.trim() === "free") {
            appPort = port;
            break;
          }
        }
        if (!appPort) {
          throw new Error(`No free port available between ${FIRST_APP_PORT} and ${LAST_APP_PORT}`);
        }
        // Reserve it now (unique constraint guards against concurrent deploys)
        await prisma.site.update({ where: { id: site.id }, data: { appPort } });
        await logStep("Node", `Assigning port ${appPort}`, "SUCCESS");
      }
      const port = appPort;

      // ── 8b. npm install ───────────────────────────────────────────────────
      await logStep("Node", "Installing npm dependencies...", "PENDING");
      let installRes = await ssh.execCommand(runAs(`cd ${projectDir} && npm install`));
      // Many projects ship with stale peer ranges (e.g. vaul@0.9 vs React 19); retry leniently on ERESOLVE
      if (installRes.code !== 0 && /ERESOLVE/.test(installRes.stderr + installRes.stdout)) {
        await logStep("Node", "Peer dependency conflict detected, retrying with --legacy-peer-deps...", "PENDING");
        installRes = await ssh.execCommand(runAs(`cd ${projectDir} && npm install --legacy-peer-deps`));
      }
      if (installRes.code !== 0) {
        const errorDetails = (installRes.stderr || installRes.stdout || "npm install exited with code " + installRes.code).trim();
        // Log last relevant lines of npm output for the user
        const sample = errorDetails.split("\n").slice(-8).join(" ");
        await logStep("Node", `Dependency installation failed: ${sample}`, "FAILED");
        throw new Error(`npm install failed: ${errorDetails}`);
      }
      await logStep("Node", "Dependencies installed successfully", "SUCCESS");

      // ── 8c. Check for build script and run build ───────────────────────────
      const pkgContent = await ssh.execCommand(`cat ${pkgPath}`);
      let hasBuildScript = false;
      let hasStartScript = false;
      let isNextApp = false;
      try {
        const parsed = JSON.parse(pkgContent.stdout);
        const deps = { ...parsed.dependencies, ...parsed.devDependencies };
        isNextApp = !!deps.next;
        hasBuildScript = !!(parsed.scripts && parsed.scripts.build);
        hasStartScript = !!(parsed.scripts && parsed.scripts.start);
      } catch (_) {}

      // Also check Next.js config files or .next folder
      if (!isNextApp) {
        const checkNextFiles = await ssh.execCommand(
          `test -f ${projectDir}/next.config.js -o -f ${projectDir}/next.config.mjs -o -f ${projectDir}/next.config.ts -o -d ${projectDir}/.next && echo "yes"`
        );
        isNextApp = checkNextFiles.stdout.includes("yes");
      }

      if (hasBuildScript) {
        await logStep("Node", "Running npm run build...", "PENDING");
        const buildRes = await ssh.execCommand(runAs(`cd ${projectDir} && npm run build`));
        if (buildRes.code !== 0) {
          const buildError = (buildRes.stderr || buildRes.stdout || "Build failed with code " + buildRes.code).trim();
          // Extract exact page errors / TypeScript / compiler error lines (like Vercel error reporting)
          const errorLines = buildError.split("\n").filter((l) => l.trim().length > 0);
          const detailedSnippet = errorLines.slice(-10).join("\n");
          await logStep("Build", `Build failed on VPS:\n${detailedSnippet}`, "FAILED");
          throw new Error(`npm run build failed: ${detailedSnippet}`);
        }
        await logStep("Node", "Build completed successfully", "SUCCESS");
      }

      // ── 8d. Launch with PM2 ────────────────────────────────────────────────
      await logStep("Node", "Launching application with PM2...", "PENDING");
      await ssh.execCommand(`pm2 delete "${domain}" 2>/dev/null || true`);

      // Determine launch method:
      // 1. Next.js app -> MUST run via npm start / next start, NEVER serve -s dist
      // 2. Custom backend entry file (server.js, app.js, index.js) -> run directly
      // 3. Static SPA (Vite / CRA / Vue) -> ONLY if dist/index.html or build/index.html actually exists
      // 4. Default Node app with start script -> npm start

      const fileExists = async (rel: string) =>
        (await ssh.execCommand(`test -f ${projectDir}/${rel} && echo "exists"`)).stdout.includes("exists");

      const hasServerJs = await fileExists("server.js");
      const hasAppJs = await fileExists("app.js");
      const hasIndexJs = await fileExists("index.js");

      // Verify that index.html exists inside dist or build so backend build folders (like dist/db.js) are NOT mistaken for static web apps
      const hasDistIndex = await fileExists("dist/index.html");
      const hasBuildIndex = await fileExists("build/index.html");
      const hasOutIndex = await fileExists("out/index.html");

      // The root PM2 daemon starts the process as the site user (--uid/--gid),
      // with HOME pointing at the site directory
      const pm2User = runAsRoot ? "" : `--uid ${siteUser} --gid ${siteUser} `;
      // HOME only changes for isolated sites; legacy sites keep the environment they had
      const pm2Env = runAsRoot ? `PORT=${port}` : `HOME=${remoteDir} PORT=${port}`;

      let pm2Cmd: string;
      if (isNextApp) {
        // Next.js: run Next.js production server on assigned port
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start npm --name "${domain}" ${pm2User}-- start -- -p ${port}`;
      } else if (hasServerJs) {
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start server.js --name "${domain}" ${pm2User}`;
      } else if (hasAppJs) {
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start app.js --name "${domain}" ${pm2User}`;
      } else if (hasIndexJs && !hasStartScript) {
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start index.js --name "${domain}" ${pm2User}`;
      } else if (hasDistIndex || hasBuildIndex || hasOutIndex) {
        await ssh.execCommand(`command -v serve || npm install -g serve`);
        const targetBuildFolder = hasDistIndex ? "dist" : hasBuildIndex ? "build" : "out";
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start serve --name "${domain}" ${pm2User}-- -s ${projectDir}/${targetBuildFolder} -l ${port}`;
      } else if (hasStartScript) {
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start npm --name "${domain}" ${pm2User}-- start -- -p ${port}`;
      } else {
        pm2Cmd = `cd ${projectDir} && ${pm2Env} pm2 start npm --name "${domain}" ${pm2User}-- start`;
      }

      const startRes = await ssh.execCommand(pm2Cmd);
      if (startRes.code !== 0) {
        throw new Error(`PM2 failed to start the app: ${(startRes.stderr || startRes.stdout).trim()}`);
      }
      await ssh.execCommand(`pm2 save`);
      await logStep("Node", `Application running in PM2 on port ${port}`, "SUCCESS");
    }

    // ── 9. Generate & upload Nginx config ───────────────────────────────────
    await logStep("Nginx", "Generating Nginx configuration...", "PENDING");
    const nginxConfig =
      isNodeApp && appPort
        ? generateNodeNginxConfig(domain, appPort)
        : generateNginxConfig(domain);

    const configPath = `/etc/nginx/sites-available/${domain}`;
    const tmpConfigPath = `/tmp/${domain}.conf`;
    await ssh.uploadString(nginxConfig, tmpConfigPath);
    await ssh.execCommand(`sudo mv ${tmpConfigPath} ${configPath}`);
    await ssh.execCommand(`sudo chown root:root ${configPath}`);
    await logStep("Nginx", "Nginx config applied", "SUCCESS");

    // ── 10. Enable site (symlink) & reload Nginx ────────────────────────────
    const enabledPath = `/etc/nginx/sites-enabled/${domain}`;
    await ssh.execCommand(`sudo ln -sf ${configPath} ${enabledPath}`);

    const testResult = await ssh.execCommand("sudo nginx -t");
    if (testResult.code !== 0) {
      throw new Error(`Nginx test failed: ${testResult.stderr}`);
    }
    await ssh.execCommand("sudo systemctl reload nginx");
    await logStep("Nginx", "Nginx validated and reloaded", "SUCCESS");

    // ── 11. Run SSL (non-fatal if DNS not yet pointed) ──────────────────────
    ssh.dispose();
    const sslResult = await runSslProvisioning(site.id);
    if (!sslResult.success) {
      await logStep("SSL", `SSL provisioning deferred (non-fatal): ${sslResult.error}`, "FAILED");
    } else {
      await logStep("SSL", "SSL certificate provisioned", "SUCCESS");
    }

    // ── 12. Update site record in Database ──────────────────────────────────
    await prisma.site.update({
      where: { id: site.id },
      data: {
        serverIp: env.VPS_HOST,
        serverPath: remoteDir,
        status: "ACTIVE",
      },
    });

    // ── 13. Update deployment record ────────────────────────────────────────
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "DEPLOYED" },
    });

    await logStep("Complete", "Deployment completed successfully", "SUCCESS");

    // ── 14. Send client email ───────────────────────────────────────────────
    if (clientUser?.email) {
      try {
        await sendSiteLiveEmail({
          to: clientUser.email,
          clientName: clientUser.name || clientUser.email,
          domain,
          serverIp: env.VPS_HOST || "",
          dbConnection: dbConnectionString,
          dbType: plan?.dbType,
        });
        await logStep("Email", `Notification email sent to ${clientUser.email}`, "SUCCESS");
      } catch (emailErr: unknown) {
        // Non-fatal
        await logStep("Email", `Failed to send email: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`, "FAILED");
      }
    }

    return { success: true, logs };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown deployment error";
    await logStep("Error", `Deployment halted: ${errorMsg}`, "FAILED");

    try {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: "FAILED" },
      });
    } catch (_) {}

    return { success: false, logs, error: errorMsg };
  } finally {
    ssh.dispose();
    // The original ZIP is kept for downloads/retries; the extracted copy is not needed
    if (localExtractDir) {
      await rm(localExtractDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
