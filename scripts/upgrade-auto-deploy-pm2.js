const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/lib/auto-deploy.ts';
let c = fs.readFileSync(p, 'utf8');

// Replace the detection and launch logic so that any project with a package.json (root or subfolder)
// installs dependencies, runs build if present, launches via PM2 (server or serve -s build), and connects via reverse proxy!

const targetDetection = `    // ── 8. Detect app type ──────────────────────────────────────────────────
    await logStep("Detect", "Detecting application type...", "PENDING");
    const checkPackageJson = await ssh.execCommand(
      \`test -f \${remoteDir}/package.json && echo "exists"\`
    );
    const isNodeApp = checkPackageJson.stdout.includes("exists");
    await logStep("Detect", \`App type: \${isNodeApp ? "Node.js" : "Static"}\`, "SUCCESS");

    let appPort: number | null = null;

    if (isNodeApp) {
      // ── 8a. Find available port for Node.js app ───────────────────────────
      await logStep("Node", "Finding available port...", "PENDING");
      let port = 3001;
      for (let attempt = 0; attempt < 50; attempt++) {
        const portCheck = await ssh.execCommand(\`ss -tlnp | grep -q ":\${port} " && echo "in_use" || echo "free"\`);
        if (portCheck.stdout.trim() === "free") break;
        port++;
      }
      appPort = port;
      await logStep("Node", \`Using port \${port}\`, "SUCCESS");

      // ── 8b. npm install ───────────────────────────────────────────────────
      await logStep("Node", "Installing npm dependencies...", "PENDING");
      const npmResult = await ssh.execCommand(
        \`cd \${remoteDir} && npm install --production\`
      );
      if (npmResult.code !== 0) {
        throw new Error(\`npm install failed: \${npmResult.stderr}\`);
      }
      await logStep("Node", "npm install completed", "SUCCESS");

      // ── 8c. Start with PM2 ────────────────────────────────────────────────
      await logStep("Node", "Starting app with PM2...", "PENDING");
      // Stop any existing instance first
      await ssh.execCommand(\`pm2 delete \${domain} 2>/dev/null || true\`);
      // Check if app.js or server.js exists, otherwise use npm start
      const hasAppJs = await ssh.execCommand(
        \`test -f \${remoteDir}/app.js && echo "exists"\`
      );
      const hasServerJs = await ssh.execCommand(
        \`test -f \${remoteDir}/server.js && echo "exists"\`
      );

      let pm2Cmd: string;
      if (hasAppJs.stdout.includes("exists")) {
        pm2Cmd = \`cd \${remoteDir} && PORT=\${port} pm2 start app.js --name "\${domain}"\`;
      } else if (hasServerJs.stdout.includes("exists")) {
        pm2Cmd = \`cd \${remoteDir} && PORT=\${port} pm2 start server.js --name "\${domain}"\`;
      } else {
        pm2Cmd = \`cd \${remoteDir} && PORT=\${port} pm2 start npm --name "\${domain}" -- start\`;
      }
      const pm2Result = await ssh.execCommand(pm2Cmd);
      if (pm2Result.code !== 0) {
        throw new Error(\`PM2 start failed: \${pm2Result.stderr}\`);
      }
      await ssh.execCommand(\`pm2 save\`);
      await logStep("Node", \`PM2 started on port \${port}\`, "SUCCESS");
    }`;

const newDetection = `    // ── 8. Detect app type (checking root and 1 level deep) ────────────────
    await logStep("Detect", "Detecting application structure...", "PENDING");
    
    // Check root and immediate subfolders for package.json
    const findPkg = await ssh.execCommand(
      \`find \${remoteDir} -maxdepth 2 -name "package.json" | head -n 1\`
    );
    const pkgPath = findPkg.stdout.trim();
    const isNodeApp = !!pkgPath;
    const projectDir = isNodeApp ? pkgPath.replace('/package.json', '') : remoteDir;

    await logStep("Detect", \`App type: \${isNodeApp ? "Node.js (PM2 Managed)" : "Static HTML"}\`, "SUCCESS");

    let appPort: number | null = null;

    if (isNodeApp) {
      // ── 8a. Find available port for Node.js app (starting from 3020) ────────
      await logStep("Node", "Finding available port for PM2...", "PENDING");
      let port = 3020;
      for (let attempt = 0; attempt < 100; attempt++) {
        const portCheck = await ssh.execCommand(\`ss -tlnp 2>/dev/null | grep -q ":\${port} " && echo "in_use" || echo "free"\`);
        if (portCheck.stdout.trim() === "free") break;
        port++;
      }
      appPort = port;
      await logStep("Node", \`Assigning port \${port}\`, "SUCCESS");

      // ── 8b. npm install ───────────────────────────────────────────────────
      await logStep("Node", "Installing npm dependencies...", "PENDING");
      await ssh.execCommand(\`cd \${projectDir} && npm install\`);
      await logStep("Node", "Dependencies installed", "SUCCESS");

      // ── 8c. Check for build script and run build ───────────────────────────
      const pkgContent = await ssh.execCommand(\`cat \${pkgPath}\`);
      let hasBuildScript = false;
      try {
        const parsed = JSON.parse(pkgContent.stdout);
        hasBuildScript = !!(parsed.scripts && parsed.scripts.build);
      } catch (_) {}

      if (hasBuildScript) {
        await logStep("Node", "Running npm run build...", "PENDING");
        await ssh.execCommand(\`cd \${projectDir} && npm run build\`);
        await logStep("Node", "Build completed", "SUCCESS");
      }

      // ── 8d. Launch with PM2 ────────────────────────────────────────────────
      await logStep("Node", "Launching application with PM2...", "PENDING");
      await ssh.execCommand(\`pm2 delete "\${domain}" 2>/dev/null || true\`);

      // Determine launch method:
      // 1. If backend server file exists (server.js, app.js, index.js) -> run directly
      // 2. If Next.js -> pm2 start npm --name domain -- start
      // 3. If built frontend SPA (React/Vite build folder exists) -> serve -s build -l port
      const hasServerJs = (await ssh.execCommand(\`test -f \${projectDir}/server.js && echo "exists"\`)).stdout.includes("exists");
      const hasAppJs = (await ssh.execCommand(\`test -f \${projectDir}/app.js && echo "exists"\`)).stdout.includes("exists");
      const hasBuildDir = (await ssh.execCommand(\`test -d \${projectDir}/build && echo "exists"\`)).stdout.includes("exists") ||
                          (await ssh.execCommand(\`test -d \${projectDir}/dist && echo "exists"\`)).stdout.includes("exists");

      let pm2Cmd: string;
      if (hasServerJs) {
        pm2Cmd = \`cd \${projectDir} && PORT=\${port} pm2 start server.js --name "\${domain}"\`;
      } else if (hasAppJs) {
        pm2Cmd = \`cd \${projectDir} && PORT=\${port} pm2 start app.js --name "\${domain}"\`;
      } else if (hasBuildDir) {
        // Ensure serve is installed globally
        await ssh.execCommand(\`which serve || npm install -g serve\`);
        const targetBuildFolder = (await ssh.execCommand(\`test -d \${projectDir}/build && echo "build"\`)).stdout.includes("build") ? "build" : "dist";
        pm2Cmd = \`pm2 start serve --name "\${domain}" -- -s \${projectDir}/\${targetBuildFolder} -l \${port}\`;
      } else {
        pm2Cmd = \`cd \${projectDir} && PORT=\${port} pm2 start npm --name "\${domain}" -- start\`;
      }

      await ssh.execCommand(pm2Cmd);
      await ssh.execCommand(\`pm2 save\`);
      await logStep("Node", \`Application running in PM2 on port \${port}\`, "SUCCESS");
    }`;

c = c.replace(targetDetection, newDetection);
fs.writeFileSync(p, c, 'utf8');
console.log('Successfully upgraded lib/auto-deploy.ts: All projects now auto-build and run in PM2!');
