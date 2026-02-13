import { NodeSSH } from "node-ssh";
import { readFileSync } from "fs";
import { join } from "path";

// Manually parse .env file
function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

loadEnv();

const ssh = new NodeSSH();

async function deploy() {
  try {
    const host = "213.210.36.173";
    
    console.log(`Connecting to ${host}...`);
    
    const sshConfig = {
      host: host,
      username: "root",
      password: "REMOVED_PASSWORD",
    };

    console.log("Attempting connection with password...");
    try {
      await ssh.connect(sshConfig);
    } catch (e) {
      console.error("Connection failed:", e.message);
      throw e;
    }

    console.log("Connected. Verifying directory...");
    
    const projectDir = "/var/www/hostmyservice";
    const checkDir = await ssh.execCommand(`ls -d ${projectDir}`);
    
    if (checkDir.code !== 0) {
      console.error(`Directory ${projectDir} not found. Searching...`);
      const searchDir = await ssh.execCommand("find /var/www -name 'hostmyservice' -type d -maxdepth 2");
      console.log("Found:", searchDir.stdout);
      // If not found in /var/www, check /root or other common places
      if (!searchDir.stdout) {
          const searchRoot = await ssh.execCommand("find /root -name 'hostmyservice' -type d -maxdepth 2");
          console.log("Found in root:", searchRoot.stdout);
      }
      ssh.dispose();
      return;
    }

    if (process.argv.includes("--logs")) {
      console.log(`Found directory at ${projectDir}. Fetching logs...`);

      // 1. Get PM2 logs to find the error digest
      const pm2Logs = await ssh.execCommand("tail -n 100 /root/.pm2/logs/hostmyservice-out.log /root/.pm2/logs/hostmyservice-error.log");
      console.log("--- PM2 LOGS ---");
      console.log(pm2Logs.stdout || pm2Logs.stderr);

      // 2. Check plans
      await ssh.execCommand(`echo "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.plan.findMany({ select: { id: true, name: true, autoRenew: true, autoRenewPlanId: true } }).then(plans => { console.log(JSON.stringify(plans)); process.exit(0); });" > ${projectDir}/check-plans.mjs`);
      const plansResult = await ssh.execCommand(`cd ${projectDir} && node check-plans.mjs`);
      console.log("PLANS:", plansResult.stdout);
      await ssh.execCommand(`rm ${projectDir}/check-plans.mjs`);

      ssh.dispose();
      return;
    }

    console.log(`Found directory at ${projectDir}. Starting deployment...`);

    // 1. Pull latest code
    console.log("Pulling latest code...");
    const pull = await ssh.execCommand("git pull origin main", { cwd: projectDir });
    console.log(pull.stdout || pull.stderr);

    // 2. Install dependencies
    console.log("Installing dependencies...");
    const install = await ssh.execCommand("npm install", { cwd: projectDir });
    console.log(install.stdout || install.stderr);

    // 3. Generate Prisma client
    console.log("Generating Prisma client...");
    const generate = await ssh.execCommand("npx prisma generate", { cwd: projectDir });
    console.log(generate.stdout || generate.stderr);

    // 4. Build
    console.log("Building project...");
    const build = await ssh.execCommand("npm run build", { cwd: projectDir });
    console.log(build.stdout || build.stderr);

    // 5. Restart PM2
    console.log("Restarting application...");
    const restart = await ssh.execCommand("pm2 restart hostmyservice");
    console.log(restart.stdout || restart.stderr);

    ssh.dispose();
    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deploy();
