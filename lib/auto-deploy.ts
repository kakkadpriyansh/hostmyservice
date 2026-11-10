import prisma from "@/lib/prisma";
import { SSHClient } from "@/lib/ssh-client";
import { generateNginxConfig, generateNodeNginxConfig } from "@/lib/nginx-config";
import { DbProvisioner } from "@/lib/db-provisioner";
import { sendSiteLiveEmail } from "@/lib/email";
import { provisionSSL } from "@/app/actions/admin/ssl";
import { env } from "@/lib/env";
import { domainSchema } from "@/lib/validations";

export async function runFullDeployment(
  deploymentId: string
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  const logs: string[] = [];
  const ssh = new SSHClient();

  // Helper: log to console, array, and DB
  const logStep = async (
    step: string,
    output: string,
    status: "SUCCESS" | "FAILED" | "PENDING"
  ) => {
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

    if (!deployment.uploadPath) {
      return {
        success: false,
        logs,
        error: "No upload archive found for this deployment",
      };
    }

    const site = deployment.site;
    const domainResult = domainSchema.safeParse(site.domain);
    if (!domainResult.success) {
      return {
        success: false,
        logs,
        error: `Invalid domain format: ${domainResult.error.message}`,
      };
    }
    const domain = domainResult.data;

    const plan = site.subscription?.plan;
    const clientUser = site.subscription?.user || site.user;
    const remoteDir = `/var/www/${domain}`;

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

    // ── 4. DB Provisioning FIRST (So connection string can be auto-injected into .env) ──
    let dbConnectionString: string | null = null;
    if (plan?.providesDb && plan?.dbType && plan.dbType !== "NONE") {
      await logStep("DB", `Provisioning dedicated ${plan.dbType} database...`, "PENDING");
      const sshDb = new SSHClient();
      try {
        await sshDb.connect();
        const dbProvisioner = new DbProvisioner(sshDb, env.VPS_HOST || "localhost");
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
        await logStep("DB", `${plan.dbType} database provisioned: ${dbConnectionString}`, "SUCCESS");
      } finally {
        sshDb.dispose();
      }
    }

    // ── 5. Create remote directory ──────────────────────────────────────────
    await logStep("Files", `Creating remote directory: ${remoteDir}`, "PENDING");
    await ssh.execCommand(`sudo mkdir -p ${remoteDir}`);
    await ssh.execCommand(`sudo chown -R $USER:$USER ${remoteDir}`);
    await logStep("Files", "Remote directory created", "SUCCESS");

    // ── 6. Upload files ─────────────────────────────────────────────────────
    await logStep("Upload", `Uploading files from ${deployment.uploadPath} to ${remoteDir}...`, "PENDING");
    await ssh.uploadDirectory(deployment.uploadPath, remoteDir);

    // Auto-flatten nested folders into main directory
    // If the customer zipped an outer folder (e.g. "real-estate-crm/"), move contents to main ${remoteDir}
    await ssh.execCommand(`
      rm -rf "${remoteDir}/__MACOSX" "${remoteDir}/.DS_Store" "${remoteDir}/Thumbs.db" 2>/dev/null || true
      if [ ! -f "${remoteDir}/package.json" ] && [ ! -f "${remoteDir}/index.html" ]; then
        FOUND_MAIN=$(find "${remoteDir}" -mindepth 1 -maxdepth 2 \( -name "package.json" -o -name "index.html" \) 2>/dev/null | head -n 1)
        if [ -n "$FOUND_MAIN" ]; then
          SUB_DIR=$(dirname "$FOUND_MAIN")
          if [ "$SUB_DIR" != "${remoteDir}" ]; then
            cp -r "$SUB_DIR"/* "${remoteDir}/" 2>/dev/null || true
            cp -r "$SUB_DIR"/.* "${remoteDir}/" 2>/dev/null || true
            rm -rf "$SUB_DIR"
          fi
        fi
      fi
    `);

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
      await logStep("Env", ".env file with auto-injected database connection written", "SUCCESS");
    }

    // ── 8. Detect app type (checking root and 1 level deep) ────────────────
    await logStep("Detect", "Detecting application structure...", "PENDING");
    
    // Check root and immediate subfolders for package.json
    const findPkg = await ssh.execCommand(
      `find ${remoteDir} -maxdepth 2 -name "package.json" | head -n 1`
    );
    const pkgPath = findPkg.stdout.trim();
    const isNodeApp = !!pkgPath;
    const projectDir = isNodeApp ? pkgPath.replace('/package.json', '') : remoteDir;

    await logStep("Detect", `App type: ${isNodeApp ? "Node.js (PM2 Managed)" : "Static HTML"}`, "SUCCESS");

    let appPort: number | null = null;

    if (isNodeApp) {
      // ── 8a. Find available port for Node.js app (starting from 3020) ────────
      await logStep("Node", "Finding available port for PM2...", "PENDING");
      let port = 3020;
      for (let attempt = 0; attempt < 100; attempt++) {
        const portCheck = await ssh.execCommand(`ss -tlnp 2>/dev/null | grep -q ":${port} " && echo "in_use" || echo "free"`);
        if (portCheck.stdout.trim() === "free") break;
        port++;
      }
      appPort = port;
      await logStep("Node", `Assigning port ${port}`, "SUCCESS");

      // ── 8b. npm install ───────────────────────────────────────────────────
      await logStep("Node", "Installing npm dependencies...", "PENDING");
      let installRes = await ssh.execCommand(`cd ${projectDir} && npm install`);
      // Many projects ship with stale peer ranges (e.g. vaul@0.9 vs React 19); retry leniently on ERESOLVE
      if (installRes.code !== 0 && /ERESOLVE/.test(installRes.stderr + installRes.stdout)) {
        await logStep("Node", "Peer dependency conflict detected, retrying with --legacy-peer-deps...", "PENDING");
        installRes = await ssh.execCommand(`cd ${projectDir} && npm install --legacy-peer-deps`);
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
        const buildRes = await ssh.execCommand(`cd ${projectDir} && npm run build`);
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

      const hasServerJs = (await ssh.execCommand(`test -f ${projectDir}/server.js && echo "exists"`)).stdout.includes("exists");
      const hasAppJs = (await ssh.execCommand(`test -f ${projectDir}/app.js && echo "exists"`)).stdout.includes("exists");
      const hasIndexJs = (await ssh.execCommand(`test -f ${projectDir}/index.js && echo "exists"`)).stdout.includes("exists");

      // Verify that index.html exists inside dist or build so backend build folders (like dist/db.js) are NOT mistaken for static web apps
      const hasDistIndex = (await ssh.execCommand(`test -f ${projectDir}/dist/index.html && echo "exists"`)).stdout.includes("exists");
      const hasBuildIndex = (await ssh.execCommand(`test -f ${projectDir}/build/index.html && echo "exists"`)).stdout.includes("exists");
      const hasOutIndex = (await ssh.execCommand(`test -f ${projectDir}/out/index.html && echo "exists"`)).stdout.includes("exists");

      let pm2Cmd: string;
      if (isNextApp) {
        // Next.js: run Next.js production server on assigned port
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start npm --name "${domain}" -- start -- -p ${port}`;
      } else if (hasServerJs) {
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start server.js --name "${domain}"`;
      } else if (hasAppJs) {
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start app.js --name "${domain}"`;
      } else if (hasIndexJs && !hasStartScript) {
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start index.js --name "${domain}"`;
      } else if (hasDistIndex || hasBuildIndex || hasOutIndex) {
        await ssh.execCommand(`which serve || npm install -g serve`);
        const targetBuildFolder = hasDistIndex ? "dist" : hasBuildIndex ? "build" : "out";
        pm2Cmd = `pm2 start serve --name "${domain}" -- -s ${projectDir}/${targetBuildFolder} -l ${port}`;
      } else if (hasStartScript) {
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start npm --name "${domain}" -- start -- -p ${port}`;
      } else {
        pm2Cmd = `cd ${projectDir} && PORT=${port} pm2 start npm --name "${domain}" -- start`;
      }

      await ssh.execCommand(pm2Cmd);
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
    const sslResult = await provisionSSL(site.id);
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
        ...(dbConnectionString ? { dbConnection: dbConnectionString } : {}),
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
      } catch (emailErr: any) {
        // Non-fatal
        await logStep("Email", `Failed to send email: ${emailErr.message}`, "FAILED");
      }
    }

    return { success: true, logs };
  } catch (error: any) {
    const errorMsg = error.message || "Unknown deployment error";
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
  }
}
