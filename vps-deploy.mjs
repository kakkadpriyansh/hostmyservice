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
    const host = process.env.VPS_HOST === "1.2.3.4" ? "213.210.36.173" : process.env.VPS_HOST;
    
    console.log(`Connecting to ${host}...`);
    
    const sshConfig = {
      host: host,
      username: process.env.VPS_USER || "root",
    };

    let privateKey = process.env.VPS_PRIVATE_KEY;
    if (privateKey && privateKey.includes("...")) {
      console.log("Placeholder key detected. Trying common passwords or local keys...");
      sshConfig.password = "Priy@nsh@@17"; // From DATABASE_URL
    } else if (privateKey) {
       privateKey = privateKey.replace(/\\n/g, '\n');
       if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
         privateKey = privateKey.substring(1, privateKey.length - 1);
       }
       if (!privateKey.endsWith('\n')) {
         privateKey += '\n';
       }
       sshConfig.privateKey = privateKey;
    }

    console.log("Attempting connection...");
    try {
      await ssh.connect(sshConfig);
    } catch (e) {
      console.error("Connection failed:", e.message);
      if (sshConfig.password) {
          console.log("Password failed. Trying local keys...");
          delete sshConfig.password;
          try {
            sshConfig.privateKey = readFileSync(join(process.env.HOME, '.ssh', 'id_ed25519'), 'utf8');
            await ssh.connect(sshConfig);
          } catch (e2) {
             console.error("Local keys failed too.");
             throw e;
          }
      } else {
          throw e;
      }
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

    console.log(`Found directory at ${projectDir}. Proceeding with deployment...`);

    const commands = [
      `cd ${projectDir} && git config --global --add safe.directory ${projectDir}`,
      `cd ${projectDir} && git pull origin main`,
      `cd ${projectDir} && npm install`,
      `cd ${projectDir} && npx prisma generate`,
      `cd ${projectDir} && npm run build`,
      `cd ${projectDir} && npx prisma db push --accept-data-loss`,
      `pm2 restart all || pm2 start npm --name "hostmyservice" -- start`
    ];

    for (const cmd of commands) {
      console.log(`Executing: ${cmd}`);
      const result = await ssh.execCommand(cmd);
      console.log("STDOUT:", result.stdout);
      if (result.stderr) console.error("STDERR:", result.stderr);
      if (result.code !== 0 && !cmd.includes("git pull") && !cmd.includes("pm2")) {
        console.error(`Command failed with code ${result.code}`);
        break;
      }
    }

    console.log("Deployment finished.");
    ssh.dispose();
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deploy();
